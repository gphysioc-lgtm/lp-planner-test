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
    // Fetch asset list from exposures-api
    const exposuresUrl = 'https://das.portfoliodashboard.xyz/positions/exposures-api';
    const exposuresRes = await fetch(exposuresUrl, { method: 'GET', headers });
    
    if (!exposuresRes.ok) {
      const errorText = await exposuresRes.text();
      console.error(`Exposures API Error (${exposuresRes.status}):`, errorText);
      throw new Error(`Exposures API returned ${exposuresRes.status}`);
    }

    const exposuresData = await exposuresRes.json();
    
    // Extract asset list from table_data
    let assets = [];
    if (exposuresData.table_data && Array.isArray(exposuresData.table_data)) {
      assets = exposuresData.table_data
        .map(item => item.asset)
        .filter(asset => asset && typeof asset === 'string')
        .map(asset => asset.trim())
        .filter(asset => asset.length > 0);
      // Remove duplicates
      assets = [...new Set(assets)];
    }

    // Fetch portfolio size from balances-api
    const balancesUrl = 'https://das.portfoliodashboard.xyz/positions/balances-api';
    const balancesRes = await fetch(balancesUrl, { method: 'GET', headers });
    
    let portfolioSize = null;
    if (balancesRes.ok) {
      const balancesData = await balancesRes.json();
      if (balancesData.totals && typeof balancesData.totals.total_balance_usd === 'number') {
        portfolioSize = balancesData.totals.total_balance_usd;
      }
    } else {
      console.warn(`Balances API returned ${balancesRes.status}, portfolio size unavailable`);
    }

    // Return combined response
    res.status(200).json({
      assets: assets,
      portfolioSize: portfolioSize
    });

  } catch (error) {
    console.error('Config fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch config data', 
      details: error.message 
    });
  }
}

