import axios from 'axios';
import * as cheerio from 'cheerio';

class YTUtil {
  constructor() {
    this.axios = axios.create();
    this.cookie = '';
    this.redirectId = '';
  }

  /**
   * Fetches information and download links for a given YouTube URL.
   * @param {object} options - The options object.
   * @param {string} options.youtubeUrl - The YouTube video URL.
   * @param {string} [options.format] - Optional format to append to the download path (e.g., 'mp3').
   * @returns {Promise<object>} An object containing video title, thumbnail, ID, available formats, and download links.
   */
  async fetchInfo({ url: youtubeUrl, format = "mp4_240p" }) {
    try {
      // Step 1: GET to homepage to get redirect + cookies
      const homepage = 'https://s.gets-top.com/';
      const getHeaders = {
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'accept-language': 'id-ID,id;q=0.9',
        'cache-control': 'no-cache',
        'pragma': 'no-cache',
        'priority': 'u=0, i',
        'sec-ch-ua': '"Lemur";v="135", "", "", "Microsoft Edge Simulate";v="135"',
        'sec-ch-ua-mobile': '?1',
        'sec-ch-ua-platform': '"Android"',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'none',
        'sec-fetch-user': '?1',
        'upgrade-insecure-requests': '1',
        'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Mobile Safari/537.36'
      };

      const getRes = await this.axios.get(homepage, {
        headers: getHeaders,
        maxRedirects: 0,
        validateStatus: status => status === 302
      });

      const redirectLocation = getRes.headers.location;
      if (!redirectLocation) throw new Error('No redirect location found');

      this.redirectId = redirectLocation.split('/').pop();
      this.cookie = (getRes.headers['set-cookie'] || []).map(c => c.split(';')[0]).join('; ');

      // Step 2: POST to /s/{id} to get video info and download page URL
      const postUrl = `https://s.gets-top.com/s/${this.redirectId}`;
      const encodedQ = encodeURIComponent(youtubeUrl);
      const postData = `q=${encodedQ}`;

      const postHeaders = {
        'accept': getHeaders.accept,
        'accept-language': getHeaders['accept-language'],
        'cache-control': 'no-cache',
        'content-type': 'application/x-www-form-urlencoded',
        'origin': 'https://s.gets-top.com',
        'pragma': 'no-cache',
        'priority': 'u=0, i',
        'referer': `https://s.gets-top.com/${this.redirectId}`,
        'sec-ch-ua': getHeaders['sec-ch-ua'],
        'sec-ch-ua-mobile': getHeaders['sec-ch-ua-mobile'],
        'sec-ch-ua-platform': getHeaders['sec-ch-ua-platform'],
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'same-origin',
        'sec-fetch-user': '?1',
        'upgrade-insecure-requests': '1',
        'user-agent': getHeaders['user-agent'],
        'cookie': this.cookie
      };

      const res = await this.axios.post(postUrl, postData, { headers: postHeaders });

      // Load the first page's HTML to extract initial info
      const $ = cheerio.load(res.data);
      const title = $('h3.item-title').text().trim();
      const thumbStyle = $('.search-item__image').attr('style') || '';
      const thumb = (thumbStyle.match(/url\(['"]?(.*?)['"]?\)/) || [])[1] || null;

      // Extract the URL to the page containing actual download links
      let downloadPath = $('.item__download').attr('data-url');

      // Append format to downloadPath if provided
      if (downloadPath && format) {
        downloadPath = `${downloadPath}/${format}`;
      }

      const formats = [];
      $('#dl_format option').each((_, el) => {
        formats.push({
          label: $(el).text().trim(),
          value: $(el).attr('value')
        });
      });

      let downloads = [];
      if (downloadPath) {
        const downloadUrl = `https://s.gets-top.com${downloadPath}`;

        // Step 3: GET the download page to scrape actual download links
        // Reusing postHeaders as they contain necessary cookies and user-agent
        const downloadRes = await this.axios.get(downloadUrl, { headers: postHeaders });

        // Load the download page's HTML
        const $downloadPage = cheerio.load(downloadRes.data);

        // Scrape all download spans from the download page
        $downloadPage('span.search-item__download.dl_progress_finished.btn_clck_spec').each((_, el) => {
          const el$ = $downloadPage(el);
          const url = el$.attr('data-href');
          const text = el$.text().trim().split('\n').map(t => t.trim()).filter(Boolean);
          const formatText = text[1] || null; // e.g., "MP4 720p"
          const size = text[2] || null;   // e.g., "15.3 MB"
          if (url) {
            downloads.push({ url, format: formatText, size });
          }
        });
      }

      return {
        title,
        thumb,
        id: this.redirectId,
        formats, // Formats from the initial page (dropdown options)
        downloads // Actual download links from the second page (after format selection if any)
      };

    } catch (err) {
      console.error('Error:', err.message);
      if (err.response) {
        console.error('Status:', err.response.status);
        console.error('Headers:', err.response.headers);
        console.error('Data:', err.response.data); // Log response data for debugging
      }
      throw err;
    }
  }
}

export default async function handler(req, res) {
  try {
    const params = req.method === "GET" ? req.query : req.body;
    if (!params.url) {
      return res.status(400).json({
        error: "No URL"
      });
    }
    const yt = new YTUtil();
    const result = await yt.fetchInfo(params);
    return res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
}