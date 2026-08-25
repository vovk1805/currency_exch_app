#!/usr/bin/env python3
"""Slow, direct Wikimedia Commons banknote downloader with retries."""

from __future__ import annotations

import json
import ssl
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "banknotes"
UA = "CurrencyExchTeachingApp/1.0 (personal educational use)"
ctx = ssl.create_default_context()

# Verified / commonly available Commons titles (File: without prefix)
FILES = {
    ("USD", 1): "United States one dollar bill, obverse.jpg",
    ("USD", 5): "US $5 Series 2006 obverse.jpg",
    ("USD", 10): "Obverse of the series 2021 $10 Federal Reserve Note.jpg",
    ("USD", 20): "Obverse of the series 2017A $20 Federal Reserve Note.jpg",
    ("USD", 50): "50 USD Series 2004 note front.jpg",
    ("USD", 100): "100 USD Series 2009 Obverse.jpg",
    ("EUR", 5): "EUR 5 obverse 2nd series.jpg",
    ("EUR", 10): "EUR_10_obverse.jpeg",
    ("EUR", 20): "The Europa series 20 € obverse side.jpg",
    ("EUR", 50): "50 EUR obverse (2017 issue).png",
    ("EUR", 100): "100 euro overview.png",
    ("EUR", 200): "200 euro overview.png",
    ("EUR", 500): "500 EUR obverse.jpg",
    ("GBP", 5): "Banknotes of the British Armed Forces Series 6 - 5 pounds.jpg",
    ("GBP", 10): "£10 Series E Bank of England note.jpg",
    ("GBP", 20): "£20 Series E Bank of England note.jpg",
    ("GBP", 50): "£50 Series E Bank of England note.jpg",
    ("PLN", 10): "10zl r.jpg",
    ("PLN", 20): "20zl r.jpg",
    ("PLN", 50): "50zl r.jpg",
    ("PLN", 100): "100zl r.jpg",
    ("PLN", 200): "200zl r.jpg",
    ("PLN", 500): "500zł awers.jpg",
    ("CHF", 10): "CHF 10 8th series front.jpg",
    ("CHF", 20): "CHF 20 8th series front.jpg",
    ("CHF", 50): "CHF 50 8th series front.jpg",
    ("CHF", 100): "CHF 100 8th series front.jpg",
    ("CHF", 200): "CHF 200 8th series front.jpg",
    ("CHF", 1000): "CHF 1000 8th series front.jpg",
    ("CZK", 100): "100CZK obverse.jpg",
    ("CZK", 200): "200CZK obverse.jpg",
    ("CZK", 500): "500CZK obverse.jpg",
    ("CZK", 1000): "1000CZK obverse.jpg",
    ("CZK", 2000): "2000CZK obverse.jpg",
    ("CZK", 5000): "5000CZK obverse.jpg",
    ("TRY", 5): "5 TL on.jpg",
    ("TRY", 10): "10 TL ön.jpg",
    ("TRY", 20): "20 TL ön.jpg",
    ("TRY", 50): "50 TL ön.jpg",
    ("TRY", 100): "100 TL ön.jpg",
    ("TRY", 200): "200 TL ön.jpg",
    ("CAD", 5): "Canada $5 Series Frontier note.jpg",
    ("CAD", 10): "Canada $10 Series Frontier note.jpg",
    ("CAD", 20): "Canada $20 Series Frontier note.jpg",
    ("CAD", 50): "Canada $50 Series Frontier note.jpg",
    ("CAD", 100): "Canada $100 Series Frontier note.jpg",
    ("JPY", 1000): "Series-E 1000 Yen Bank of Japan note - front.jpg",
    ("JPY", 2000): "2000 Yen Banknote.jpg",
    ("JPY", 5000): "Series-E 5000 Yen Bank of Japan note - front.jpg",
    ("JPY", 10000): "Series-E 10000 Yen Bank of Japan note - front.jpg",
    ("CNY", 1): "1 Chinese Yuan banknote 1999.jpg",
    ("CNY", 5): "5 Chinese Yuan banknote 2005.jpg",
    ("CNY", 10): "RMB-10-2.jpg",
    ("CNY", 20): "20 Chinese Yuan banknote 2005.jpg",
    ("CNY", 50): "50 Chinese Yuan banknote 2005.jpg",
    ("CNY", 100): "100 Chinese Yuan banknote 2005.jpg",
    ("UAH", 1): "1 hryvnia 2006 frontside.jpg",
    ("UAH", 2): "2 hryvnia 2004 frontside.jpg",
    ("UAH", 5): "5 hryvnia 2015 frontside.jpg",
    ("UAH", 10): "10 hryvnia 2015 frontside.jpg",
    ("UAH", 20): "20 hryvnia 2018 frontside.jpg",
    ("UAH", 50): "50 hryvnia 2019 frontside.jpg",
    ("UAH", 100): "100 hryvnia 2014 frontside.jpg",
    ("UAH", 200): "200 hryvnia 2019 frontside.jpg",
    ("UAH", 500): "500 hryvnia 2015 frontside.jpg",
    ("UAH", 1000): "1000 hryvnia 2019 frontside.jpg",
}

ALTS = {
    ("USD", 20): ["US $20 Series 2004A obverse.jpg", "20dollarbillobverse.jpg"],
    ("USD", 50): ["US $50 Series 2004A obverse.jpg", "50dollarbillobverse.jpg"],
    ("USD", 100): ["US100dollarbill-Series 2009.jpg", "Obverse of the series 2009A $100 Federal Reserve Note.jpg"],
    ("EUR", 5): ["New 5 euro banknotes.jpg", "5 euro 2S front uvc.jpg"],
    ("EUR", 10): ["10 euro banknote second series.jpg", "EUR 10 obverse (2014 issue).png"],
    ("EUR", 20): ["20euro second Draghi.jpg", "EUR 20 obverse (2015 issue).png"],
    ("EUR", 50): ["50euro.jpg", "EUR 50 obverse 2nd series.jpg"],
    ("EUR", 100): ["100euro.jpg", "EUR 100 obverse (2019 issue).png"],
    ("EUR", 200): ["200euro.jpg", "EUR 200 obverse (2019 issue).png"],
    ("EUR", 500): ["500euro.jpg", "500 euro banknote first series front.jpg"],
    ("GBP", 5): ["Series F £5 Bank of England note.jpg", "Bank of England £5 note Series G.jpg"],
    ("GBP", 10): ["Series F £10 Bank of England note.jpg", "Bank of England £10 note Series G.jpg"],
    ("GBP", 20): ["Series F £20 Bank of England note.jpg", "Bank of England £20 note Series G.jpg"],
    ("GBP", 50): ["Series F £50 Bank of England note.jpg", "Bank of England £50 note Series G.jpg"],
    ("PLN", 10): ["POL-new 10 złoty av.jpg", "10 PLN.jpg"],
    ("PLN", 20): ["POL-new 20 złoty av.jpg", "20 PLN.jpg"],
    ("PLN", 50): ["POL-new 50 złoty av.jpg", "50 PLN.jpg"],
    ("PLN", 100): ["POL-new 100 złoty av.jpg", "100 PLN.jpg"],
    ("PLN", 200): ["POL-new 200 złoty av.jpg", "200 PLN.jpg"],
    ("PLN", 500): ["500 zloty 2017.jpg", "POL 500 złoty.jpg"],
    ("CHF", 10): ["10 Swiss Francs 2017 front.jpg", "10 CHF.jpg"],
    ("CHF", 20): ["20 Swiss Francs 2017 front.jpg", "20 CHF.jpg"],
    ("CHF", 50): ["50 Swiss Francs 2016 front.jpg", "50 CHF.jpg"],
    ("CHF", 100): ["100 Swiss Francs 2019 front.jpg", "100 CHF.jpg"],
    ("CHF", 200): ["200 Swiss Francs 2018 front.jpg", "200 CHF.jpg"],
    ("CHF", 1000): ["1000 Swiss Francs 2019 front.jpg", "1000 CHF.jpg"],
    ("CZK", 100): ["CZE-new 100 korun av.jpg", "100 korun.jpg"],
    ("CZK", 200): ["CZE-new 200 korun av.jpg", "200 korun.jpg"],
    ("CZK", 500): ["CZE-new 500 korun av.jpg", "500 korun.jpg"],
    ("CZK", 1000): ["CZE-new 1000 korun av.jpg", "1000 korun.jpg"],
    ("CZK", 2000): ["CZE-new 2000 korun av.jpg", "2000 korun.jpg"],
    ("CZK", 5000): ["CZE-new 5000 korun av.jpg", "5000 korun.jpg"],
    ("TRY", 5): ["5 Turkish Lira obverse.jpg", "Turkey 5 lira front.jpg"],
    ("TRY", 10): ["10 Turkish Lira obverse.jpg", "Turkey 10 lira front.jpg"],
    ("TRY", 20): ["20 Turkish Lira obverse.jpg", "Turkey 20 lira front.jpg"],
    ("TRY", 50): ["50 Turkish Lira obverse.jpg", "Turkey 50 lira front.jpg"],
    ("TRY", 100): ["100 Turkish Lira obverse.jpg", "Turkey 100 lira front.jpg"],
    ("TRY", 200): ["200 Turkish Lira obverse.jpg", "Turkey 200 lira front.jpg"],
    ("CAD", 5): ["Canadian $5 Frontier Series.jpg", "5 dollar bill Canada.jpg"],
    ("CAD", 10): ["Canadian $10 Frontier Series.jpg", "10 dollar bill Canada.jpg"],
    ("CAD", 20): ["Canadian $20 Frontier Series.jpg", "20 dollar bill Canada.jpg"],
    ("CAD", 50): ["Canadian $50 Frontier Series.jpg", "50 dollar bill Canada.jpg"],
    ("CAD", 100): ["Canadian $100 Frontier Series.jpg", "100 dollar bill Canada.jpg"],
    ("JPY", 1000): ["1000 Yen 2004 front.jpg", "1000yen.jpg"],
    ("JPY", 2000): ["2000yen.jpg", "Series D 2000 Yen.jpg"],
    ("JPY", 5000): ["5000 Yen 2004 front.jpg", "5000yen.jpg"],
    ("JPY", 10000): ["10000 Yen 2004 front.jpg", "10000yen.jpg"],
    ("CNY", 1): ["1 yuan.jpg", "RMB 1 yuan.jpg"],
    ("CNY", 5): ["5 yuan.jpg", "RMB 5 yuan.jpg"],
    ("CNY", 10): ["10 yuan.jpg", "RMB 10 yuan.jpg"],
    ("CNY", 20): ["20 yuan.jpg", "RMB 20 yuan.jpg"],
    ("CNY", 50): ["50 yuan.jpg", "RMB 50 yuan.jpg"],
    ("CNY", 100): ["100 yuan.jpg", "RMB 100 yuan.jpg"],
    ("UAH", 1): ["1 UAH front.jpg", "Ukraine 1 hryvnia.jpg"],
    ("UAH", 2): ["2 UAH front.jpg", "Ukraine 2 hryvnia.jpg"],
    ("UAH", 5): ["5 UAH front.jpg", "Ukraine 5 hryvnia.jpg"],
    ("UAH", 10): ["10 UAH front.jpg", "Ukraine 10 hryvnia.jpg"],
    ("UAH", 20): ["20 UAH front.jpg", "Ukraine 20 hryvnia.jpg"],
    ("UAH", 50): ["50 UAH front.jpg", "Ukraine 50 hryvnia.jpg"],
    ("UAH", 100): ["100 UAH front.jpg", "Ukraine 100 hryvnia.jpg"],
    ("UAH", 200): ["200 UAH front.jpg", "Ukraine 200 hryvnia.jpg"],
    ("UAH", 500): ["500 UAH front.jpg", "Ukraine 500 hryvnia.jpg"],
    ("UAH", 1000): ["1000 UAH front.jpg", "Ukraine 1000 hryvnia.jpg"],
}


def http_get(url: str, retries: int = 6) -> bytes:
    delay = 3.0
    for attempt in range(retries):
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        try:
            with urllib.request.urlopen(req, context=ctx, timeout=90) as resp:
                return resp.read()
        except urllib.error.HTTPError as exc:
            if exc.code in (429, 503) and attempt < retries - 1:
                print(f"    rate-limited, sleep {delay:.0f}s")
                time.sleep(delay)
                delay = min(delay * 1.8, 60)
                continue
            raise
    raise RuntimeError(f"failed {url}")


def image_url_for_title(title: str) -> str | None:
    params = {
        "action": "query",
        "titles": f"File:{title}",
        "prop": "imageinfo",
        "iiprop": "url|mime|size",
        "iiurlwidth": "900",
        "format": "json",
    }
    api = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(params)
    raw = http_get(api)
    data = json.loads(raw.decode("utf-8"))
    pages = data.get("query", {}).get("pages", {})
    for page in pages.values():
        if int(page.get("ns", -1)) != 6:
            continue
        if "missing" in page:
            return None
        infos = page.get("imageinfo") or []
        if not infos:
            return None
        info = infos[0]
        mime = (info.get("mime") or "").lower()
        if not mime.startswith("image/"):
            return None
        return info.get("thumburl") or info.get("url")
    return None


def candidates(code: str, denom: int) -> list[str]:
    names = []
    primary = FILES.get((code, denom))
    if primary:
        names.append(primary)
    for name in ALTS.get((code, denom), []):
        if name not in names:
            names.append(name)
    return names


def main() -> None:
    needed = list(FILES.keys())
    missing = []
    ok = 0

    for code, denom in needed:
        folder = OUT / code
        folder.mkdir(parents=True, exist_ok=True)
        dest = folder / f"{denom}.jpg"
        if dest.exists() and dest.stat().st_size > 3000:
            print(f"SKIP {code}/{denom}")
            ok += 1
            continue

        print(f"GET  {code}/{denom}")
        saved = False
        for title in candidates(code, denom):
            try:
                url = image_url_for_title(title)
            except Exception as exc:
                print(f"  api fail {title}: {exc}")
                time.sleep(4)
                continue
            if not url:
                print(f"  no file: {title}")
                time.sleep(1.5)
                continue
            try:
                data = http_get(url)
                if len(data) < 2500:
                    print(f"  tiny: {title}")
                    continue
                dest.write_bytes(data)
                print(f"  OK {title} ({len(data)} bytes)")
                saved = True
                ok += 1
                break
            except Exception as exc:
                print(f"  dl fail {title}: {exc}")
                dest.unlink(missing_ok=True)
            time.sleep(2)

        if not saved:
            missing.append(f"{code}/{denom}")
            print(f"  MISS {code}/{denom}")
        time.sleep(2.5)

    print(f"\nDone {ok}/{len(needed)}")
    if missing:
        print("Missing:")
        for item in missing:
            print(" -", item)


if __name__ == "__main__":
    main()
