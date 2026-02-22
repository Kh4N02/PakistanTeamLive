# How to get all channels m3u8 URLs (live.vpnhosted.com)

You have one working URL pattern:
`https://live.vpnhosted.com/Sky_sports_cricket_HD/index.m3u8?token=YOUR_TOKEN`

## 1. Try a master playlist

Many HLS servers expose one playlist that lists every channel. Try (replace YOUR_TOKEN):

```bash
TOKEN="5d4b5bf07d959f3c2d83ba82b413d5d3"
wget -q -O - "https://live.vpnhosted.com/index.m3u8?token=$TOKEN"
wget -q -O - "https://live.vpnhosted.com/playlist.m3u8?token=$TOKEN"
wget -q -O - "https://live.vpnhosted.com/all.m3u8?token=$TOKEN"
wget -q -O - "https://live.vpnhosted.com/channels.m3u8?token=$TOKEN"
wget -q -O - "https://live.vpnhosted.com/playlist.m3u?token=$TOKEN"
```

If any returns a list of EXTINF lines and URLs, save it:

```bash
wget -O all-channels.m3u8 "https://live.vpnhosted.com/playlist.m3u8?token=$TOKEN"
```

Open `all-channels.m3u8` in a text editor to see every channel and its m3u8 URL.

## 2. If you have channel names

URL pattern is usually:
`https://live.vpnhosted.com/CHANNEL_SLUG/index.m3u8?token=TOKEN`

Run: `node get-all-m3u8.js`. Add to .env:
  CHANNEL_M3U8_TOKEN=5d4b5bf07d959f3c2d83ba82b413d5d3
  CHANNEL_SLUGS=Sky_sports_cricket_HD,Sky_sports_main_HD,Sky_sports_football_HD
The script tries master playlist URLs and, if CHANNEL_SLUGS is set, builds and checks each channel URL.

## 3. Quick one-liner

```bash
TOKEN="5d4b5bf07d959f3c2d83ba82b413d5d3"
wget -O all-channels.m3u8 "https://live.vpnhosted.com/playlist.m3u8?token=$TOKEN"
cat all-channels.m3u8
```

If the file has many EXTINF lines and URLs, those are your channel m3u8 links.
