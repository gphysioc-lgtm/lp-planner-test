export default async function handler(req, res) {
  // Get credentials from environment variables
  const clientId = process.env.CF_ACCESS_CLIENT_ID;
  const clientSecret = process.env.CF_ACCESS_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: 'Server config error: Missing Cloudflare Access credentials.' });
  }

  const headers = {
    'Content-Type': 'application/json',
    'CF-Access-Client-Id': clientId,
    'CF-Access-Client-Secret': clientSecret
  };

  try {
    // Fetch portfolio size from balances-api
    const balancesUrl = 'https://das.portfoliodashboard.xyz/positions/balances-api';
    const balancesRes = await fetch(balancesUrl, { method: 'GET', headers });

    if (!balancesRes.ok) {
      const errorText = await balancesRes.text();
      console.error(`Balances API Error (${balancesRes.status}):`, errorText);
      throw new Error(`Balances API returned ${balancesRes.status}: ${balancesRes.statusText}`);
    }

    const balancesData = await balancesRes.json();
    
    let portfolioSize = null;
    if (balancesData.totals && typeof balancesData.totals.total_balance_usd === 'number') {
      portfolioSize = balancesData.totals.total_balance_usd;
    } else {
      throw new Error('Portfolio size not found in API response');
    }

    res.status(200).json({ portfolioSize: portfolioSize });

  } catch (error) {
    console.error('Portfolio size fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch portfolio size', 
      details: error.message 
    });
  }
}

