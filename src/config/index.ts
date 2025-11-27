export const config = () => ({
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'kafel',
    sync: process.env.DB_SYNC || false,
  },
  firebaseConfig: {
    type: process.env.TYPE || '',
    project_id: process.env.PROJECT_ID || '',
    private_key_id: process.env.PRIVATE_KEY_ID || '',
    private_key: process.env.PRIVATE_KEY.replace(/\\n/g, '\n') || '',
    client_email: process.env.CLIENT_EMAIL || '',
    client_id: process.env.CLIENT_ID || '',
    auth_uri: process.env.AUTH_URI || '',
    token_uri: process.env.TOKEN_URI || '',
    auth_provider_x509_cert_url: process.env.AUTH_PROVIDER_X509_CERT_URL || '',
    client_x509_cert_url: process.env.CLIENT_X509_CERT_URL || '',
    universe_domain: process.env.UNIVERSE_DOMAIN || '',
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookKey: process.env.STRIPE_WEBHOOK_KEY || '',
  },
  crypto: {
    usdtWalletAddress: process.env.USDT_WALLET_ADDRESS,
    usdcWalletAddress: process.env.USDC_WALLET_ADDRESS,
    providerUrl: process.env.CRYPTO_PROVIDER_URL || '',
    usdtContractAddress: process.env.USDT_CONTRACT_ADDRESS,
    usdcContractAddress: process.env.USDC_CONTRACT_ADDRESS,
  },
});
