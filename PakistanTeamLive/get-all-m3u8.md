# How to get all channels' m3u8 URLs (live.vpnhosted.com)

You already have one working URL:

```
https://live.vpnhosted.com/Sky_sports_cricket_HD/index.m3u8?token=YOUR_TOKEN
```

To get **all** channels there are two approaches.

---

## 1. Try a master playlist (all channels in one file)

Many HLS/IPTV servers expose a single playlist that lists every channel. Try these with your token (replace `YOUR_TOKEN`):

```bash
TOKEN="5d4b5bf07d959f3c2d83ba82b413d5d3"

wget -q -O - "https://live.vpnhosted.com/index.m3u8?token=$TOKEN"
wget -q -O - "https://live.vpnhosted.com/playlist.m3u8?token=$TOKEN"
wget -q -O - "https://live.vpnhosted.com/all.m3u8?token=$TOKEN"
wget -q -O - "https://live.vpnhosted.com/channels.m3u8?token=$TOKEN"
wget -q -O - "https://live.vpnhosted.com/playlist.m3u?token=$TOKEN"
```

If any returns a list of #EXTINF lines and URLs, that is your "all channels" playlist. Save it:

```bash
wget -O all-channels.m3u8 "https://live.vpnhosted.com/playlist.m3u8?token=$TOKEN"
```

Then open `all-channels.m3u8` in a text editor to see every channel and its m3u8 URL.

---

## 2. If you have a list of channel names

If the provider gives you channel names, the URL pattern is often:

```
https://live.vpnhosted.com/<CHANNEL_SLUG>/index.m3u8?token=<TOKEN>
```

Use the script in this repo to build and optionally test URLs for many channels:

```bash
node get-all-m3u8.js
```

---

## 3. Where to find channel names

- Check the provider dashboard or "channel list" page.
- If you get a different playlist file (e.g. channels.m3u), open it and copy the channel paths from the URLs.
- Try common names with the same token: Sky_sports_main_HD, Sky_sports_football_HD, BT_Sport_1, etc.

---

## Quick one-liner

To try the root playlist and save it:

```bash
TOKEN="5d4b5bf07d959f3c2d83ba82b413d5d3"
wget -O all-channels.m3u8 "https://live.vpnhosted.com/playlist.m3u8?token=$TOKEN"
cat all-channels.m3u8
```

If the file has many #EXTINF lines and URLs, those are your channel m3u8 links.
