#!/usr/bin/env python3
"""
Generate tokenizer-data.json for the TokenizerComparison widget.

Dependencies: tiktoken, transformers (for SentencePiece via T5 tokenizer).
Install with:  pip install tiktoken transformers sentencepiece

Run this once; commit the resulting JSON. Re-run if examples change.
"""
import json
import sys
from datetime import datetime

# Try imports with friendly errors
try:
    import tiktoken
except ImportError:
    sys.exit("Install tiktoken:  pip install tiktoken")

try:
    from transformers import AutoTokenizer
except ImportError:
    sys.exit("Install transformers:  pip install transformers sentencepiece")


# ---------------------------------------------------------------------------
# The 12 example texts — curated to highlight tokenizer differences
# ---------------------------------------------------------------------------
EXAMPLES = [
    # English baseline
    {
        'id': 'english-short',
        'text': "Hello, world!",
        'category': 'english',
        'label': "English: simple greeting",
    },
    {
        'id': 'english-medium',
        'text': "The quick brown fox jumps over the lazy dog.",
        'category': 'english',
        'label': "English: pangram",
    },
    # Multilingual
    {
        'id': 'korean',
        'text': "안녕하세요. 만나서 반갑습니다.",
        'category': 'multilingual',
        'label': "Korean: greeting",
    },
    {
        'id': 'chinese',
        'text': "你好,世界!这是一段中文。",
        'category': 'multilingual',
        'label': "Chinese: hello world + sentence",
    },
    {
        'id': 'hindi',
        'text': "नमस्ते दुनिया",
        'category': 'multilingual',
        'label': "Hindi: hello world",
    },
    {
        'id': 'russian',
        'text': "Привет, мир!",
        'category': 'multilingual',
        'label': "Russian: hello world",
    },
    # Numbers
    {
        'id': 'numbers-short',
        'text': "I have 12 apples and 345 oranges.",
        'category': 'numbers',
        'label': "Numbers: short",
    },
    {
        'id': 'numbers-long',
        'text': "Pi is approximately 3.14159265358979323846.",
        'category': 'numbers',
        'label': "Numbers: long (pi)",
    },
    # Code
    {
        'id': 'python-code',
        'text': "def hello():\n    print('world')\nhello()",
        'category': 'code',
        'label': "Code: Python function",
    },
    {
        'id': 'json-like',
        'text': '{"name": "cat", "age": 7, "colors": ["black", "white"]}',
        'category': 'code',
        'label': "Code: JSON-like structure",
    },
    # Special cases
    {
        'id': 'emoji',
        'text': "🐱 🪑 🛏",
        'category': 'special',
        'label': "Emoji: three emoji",
    },
    {
        'id': 'solidgoldmagikarp',
        'text': " SolidGoldMagikarp",
        'category': 'special',
        'label': "Glitch token: SolidGoldMagikarp",
    },
]


# ---------------------------------------------------------------------------
# Tokenizer initialization
# ---------------------------------------------------------------------------
gpt2_tok = tiktoken.get_encoding("gpt2")
gpt4_tok = tiktoken.get_encoding("cl100k_base")
# T5 uses SentencePiece (Unigram LM variant)
sp_tok = AutoTokenizer.from_pretrained("t5-small")


def tokenize_with_gpt(tok, text):
    """Tokenize and return display-friendly tokens + ids."""
    ids = tok.encode(text)
    # Decode each token individually for display
    tokens = []
    for tid in ids:
        s = tok.decode_single_token_bytes(tid).decode('utf-8', errors='replace')
        # Convert whitespace to visible glyphs
        s = s.replace(' ', '␣').replace('\n', '↵').replace('\t', '⇥')
        tokens.append(s)
    return tokens, ids


def tokenize_with_sentencepiece(tok, text):
    """Tokenize a string with the T5 SentencePiece tokenizer."""
    ids = tok.encode(text, add_special_tokens=False)
    raw_tokens = tok.convert_ids_to_tokens(ids)
    # SentencePiece uses '▁' (U+2581) for word-initial; convert to '␣' for visual consistency
    tokens = [t.replace('▁', '␣') for t in raw_tokens]
    return tokens, ids


def main():
    out_tokenizers = [
        {
            'id': 'gpt2',
            'name': 'GPT-2 (BPE)',
            'vocabSize': gpt2_tok.n_vocab,
            'description': 'Byte-level BPE trained on WebText (~40GB). Used by GPT-2.',
        },
        {
            'id': 'gpt4',
            'name': 'GPT-4 (cl100k_base)',
            'vocabSize': gpt4_tok.n_vocab,
            'description': 'Byte-level BPE with improved number handling. Used by GPT-3.5+ and GPT-4.',
        },
        {
            'id': 'sentencepiece-t5',
            'name': 'SentencePiece (T5)',
            'vocabSize': sp_tok.vocab_size,
            'description': 'Unigram LM tokenizer (Kudo 2018). Used by T5, mT5, ALBERT.',
        },
    ]

    out_examples = []
    for ex in EXAMPLES:
        text = ex['text']
        byte_len = len(text.encode('utf-8'))
        tokenizations = {}

        for tok_id, tok in [('gpt2', gpt2_tok), ('gpt4', gpt4_tok)]:
            tokens, ids = tokenize_with_gpt(tok, text)
            tokenizations[tok_id] = {
                'tokens': tokens,
                'tokenIds': ids,
                'tokenCount': len(tokens),
                'bytesPerToken': byte_len / max(len(tokens), 1),
            }

        sp_tokens, sp_ids = tokenize_with_sentencepiece(sp_tok, text)
        tokenizations['sentencepiece-t5'] = {
            'tokens': sp_tokens,
            'tokenIds': sp_ids,
            'tokenCount': len(sp_tokens),
            'bytesPerToken': byte_len / max(len(sp_tokens), 1),
        }

        out_examples.append({**ex, 'tokenizations': tokenizations})

    out = {
        'generatedAt': datetime.utcnow().isoformat() + 'Z',
        'tokenizers': out_tokenizers,
        'examples': out_examples,
    }

    out_path = 'src/components/widgets/ch03/tokenizer-data.json'
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    print(f"Wrote {out_path}")


if __name__ == '__main__':
    main()
