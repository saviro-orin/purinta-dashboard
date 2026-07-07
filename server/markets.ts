export const VAULT_ADDRESS = '0xc92A37Fd0250F4eecF092960a2F70A1334217528';
export const MORPHO_BLUE = '0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb';
export const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';

export interface PurintaMarketConfig {
  id: string;
  name: string;
  loan_symbol: string;
  collateral_symbol: string;
  loan_address: string;
  collateral_address: string;
  oracle_address: string;
  lltv: number;
}

export const PURINTA_MARKETS: PurintaMarketConfig[] = [
  {
    id: '0xde2bb82278de27e7851625e2d7c25280adc6d499c000cc6904eb0ab29124a481',
    name: 'PEPE / USDC',
    loan_symbol: 'USDC',
    collateral_symbol: 'PEPE',
    loan_address: USDC_ADDRESS,
    collateral_address: '0x6982508145454Ce325dDbE47a25d4ec3d2311933',
    oracle_address: '0xAe53190c12cb206A497EB45d2be1dd0A87046501',
    lltv: 0.625,
  },
  {
    id: '0x31a277fde40c1bd37dd00cb2167fe1d5831b450efecc63323679228a101e9979',
    name: 'SPX / USDC',
    loan_symbol: 'USDC',
    collateral_symbol: 'SPX',
    loan_address: USDC_ADDRESS,
    collateral_address: '0xE0f63A424a4439cBE457D80E4f4b51aD25b2c56C',
    oracle_address: '0x5D4ad982F7F67003c7F0c2F1807f7c3d08B80c8b',
    lltv: 0.625,
  },
];
