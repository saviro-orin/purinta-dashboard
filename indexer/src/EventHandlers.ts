import { MorphoBlue } from 'generated';

const PURINTA_MARKETS = new Set([
  '0xde2bb82278de27e7851625e2d7c25280adc6d499c000cc6904eb0ab29124a481',
  '0x31a277fde40c1bd37dd00cb2167fe1d5831b450efecc63323679228a101e9979',
]);

function shouldTrack(id: string): boolean {
  return PURINTA_MARKETS.has(id.toLowerCase());
}

function eventId(event: { transaction: { hash: string }; logIndex: number }): string {
  return `${event.transaction.hash}-${event.logIndex}`;
}

function saveEvent(context: any, event: any, eventName: string, account: string, assets: bigint) {
  if (!shouldTrack(event.params.id)) return;

  context.MarketEvent.set({
    id: eventId(event),
    marketId: event.params.id.toLowerCase(),
    eventName,
    account: account.toLowerCase(),
    assets,
    blockNumber: event.block.number,
    timestamp: event.block.timestamp,
    transactionHash: event.transaction.hash,
  });
}

MorphoBlue.Supply.handler(({ event, context }) => {
  saveEvent(context, event, 'Supply', event.params.onBehalf, event.params.assets);
});

MorphoBlue.Withdraw.handler(({ event, context }) => {
  saveEvent(context, event, 'Withdraw', event.params.onBehalf, event.params.assets);
});

MorphoBlue.Borrow.handler(({ event, context }) => {
  saveEvent(context, event, 'Borrow', event.params.onBehalf, event.params.assets);
});

MorphoBlue.Repay.handler(({ event, context }) => {
  saveEvent(context, event, 'Repay', event.params.onBehalf, event.params.assets);
});

MorphoBlue.Liquidate.handler(({ event, context }) => {
  saveEvent(context, event, 'Liquidate', event.params.borrower, event.params.repaidAssets);
});
