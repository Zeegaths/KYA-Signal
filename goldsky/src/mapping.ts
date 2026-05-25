import { BigDecimal } from '@graphprotocol/graph-ts'
import { LiquidationCall } from '../generated/AaveLiquidations/AavePool'
import { AgentEvent } from '../generated/schema'

export function handleLiquidationCall(event: LiquidationCall): void {
  let id = event.transaction.hash.toHex() + '-' + event.logIndex.toString()
  let entity = new AgentEvent(id)
  entity.agent = event.params.user.toHexString()
  entity.eventType = 'LIQUIDATION'
  entity.blockNumber = event.block.number
  entity.timestamp = event.block.timestamp
  entity.txHash = event.transaction.hash.toHex()
  entity.collateralAsset = event.params.collateralAsset.toHexString()
  entity.debtAsset = event.params.debtAsset.toHexString()
  entity.amount = event.params.debtToCover.toBigDecimal()
  entity.chain = 'ethereum'
  entity.save()
}
