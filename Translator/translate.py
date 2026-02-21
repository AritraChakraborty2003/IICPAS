"""CLI helper that extracts visible text from a file and translates it into Indian languages."""

from __future__ import annotations

import argparse
from pathlib import Path
from typing import Iterable

from bs4 import BeautifulSoup
from googletrans import Translator


def extract_text_from_html(raw: str) -> str:
    soup = BeautifulSoup(raw, "html.parser")
    # Collect visible strings while preserving spacing.
    text_pieces = [chunk.strip() for chunk in soup.stripped_strings]
    return "\n".join(piece for piece in text_pieces if piece)


def translate_text(text: str, langs: Iterable[tuple[str, str]]) -> None:
    translator = Translator()
    for name, code in langs:
        print(f"\n--- {name} ({code}) ---")
        if not text.strip():
            print("(no content to translate)")
            continue
        translation = translator.translate(text, dest=code)
        print(translation.text)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Translate the text content of an HTML or plain text file into Indian languages",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument(
        "-i",
        "--input",
        type=Path,
        required=True,
        help="Path to the input HTML or plain text file",
    )
    parser.add_argument(
        "-l",
        "--languages",
        nargs="*",
        default=["hi", "bn", "gu", "mr"],
        help="ISO language codes to translate into (default: Hindi, Bengali, Gujarati, Marathi)",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if not args.input.exists():
        raise SystemExit(f"Input file does not exist: {args.input}")
    raw_content = args.input.read_text(encoding="utf-8")
    text = extract_text_from_html(raw_content)
    lang_map = {
        "hi": "Hindi",
        "bn": "Bengali",
        "gu": "Gujarati",
        "mr": "Marathi",
    }
    langs = [(lang_map.get(code, code), code) for code in args.languages]
    translate_text(text, langs)


if __name__ == "__main__":
    main()
