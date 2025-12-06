export default async function handler(req, res) {
  const { ids, vs_currencies } = req.query;
  // Make sure this Variable is set in Vercel!
  const apiKey = process.env.COINGECKO_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Server configuration error: API Key missing' });
  }

  if (!ids || !vs_currencies) {
    return res.status(400).json({ error: 'Missing ids or vs_currencies' });
  }

  try {
    const url = `https://pro-api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=${vs_currencies}&x_cg_pro_api_key=${apiKey}`;

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.statusText}`);
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch prices' });
  }
}
