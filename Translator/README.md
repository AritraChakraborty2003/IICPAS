# Translator helper

Simple CLI for extracting text from an HTML or plain text file and translating it into Hindi, Bengali, Gujarati, and Marathi.

## Install dependencies

```bash
pip install googletrans==4.0.0-rc1 beautifulsoup4
```

## Usage

```bash
python translator/translate.py --input path/to/content.html
```

Use `-l`/`--languages` to override the default four languages if needed. The script prints each language’s translation to stdout.

### Docker

Build the translator image:
```bash
docker build -t iicpa-translator translator/
```

Mount a local directory containing the source file and run:
```bash
docker run --rm -v "$(pwd)/translator:/workspace" iicpa-translator --input /workspace/sample.html
```

Any additional CLI flags supported by `translate.py` can be passed after the image name.
