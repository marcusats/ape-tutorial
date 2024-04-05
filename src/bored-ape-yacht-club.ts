import {
  Approval as ApprovalEvent,
  ApprovalForAll as ApprovalForAllEvent,
  OwnershipTransferred as OwnershipTransferredEvent,
  Transfer as TransferEvent
} from "../generated/BoredApeYachtClub/BoredApeYachtClub"
import {
  Approval,
  Transfer,
  ApeContent,
  Ape
} from "../generated/schema"
import { dataSource, DataSourceContext, DataSourceTemplate, Bytes } from "@graphprotocol/graph-ts"

const BASE_URI = "QmeSjSinHpPnmXmspMjwiXyN6zS4E9zccariGR3jxcaWtq"
const TOKEN_ID_KEY = "tokenId";

export function handleApproval(event: ApprovalEvent): void {
  let entity = new Approval(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.owner = event.params.owner
  entity.approved = event.params.approved
  entity.tokenId = event.params.tokenId

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  let ape = Ape.load(event.params.tokenId.toString())
  if (ape == null) {
    ape = new Ape(event.params.tokenId.toString())
    ape.tokenId = event.params.tokenId
    ape.owner = event.params.owner.toHexString()
    ape.lastTrasnfer = event.block.timestamp

    ape.save()

    let context = new DataSourceContext();
    context.setString(TOKEN_ID_KEY, event.params.tokenId.toString());
    let hash = BASE_URI + "/" + event.params.tokenId.toString();
    DataSourceTemplate.createWithContext("IpfsContent", [hash], context);

  }

  entity.save()
}

export function handleApeContent(content: Bytes): void {
  let hash = dataSource.stringParam()
  let id = dataSource.context().getString(TOKEN_ID_KEY)

  let apeCont = new ApeContent(id)
  apeCont.content = content.toString()
  apeCont.ape = id
  apeCont.adHash = hash

  apeCont.save()

}

export function handleTransfer(event: TransferEvent): void {
  let entity = new Transfer(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  if (event.params.from.toHexString() == "0x0") {
    entity.from = "0x0000000000000000000000000000000000000000";
  } else {
    entity.from = event.params.from.toHexString();
  }
  
  entity.to = event.params.to.toHexString()
  entity.tokenId = event.params.tokenId

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  let ape = Ape.load(event.params.tokenId.toString())
  if (ape == null) {
    let newApe = new Ape(event.params.tokenId.toString())
    newApe.tokenId = event.params.tokenId
    newApe.owner = event.params.to.toHexString()
    newApe.lastTrasnfer = event.block.timestamp
    newApe.save()

    let context = new DataSourceContext();
    context.setString(TOKEN_ID_KEY, event.params.tokenId.toString());
    let hash = BASE_URI + "/" + event.params.tokenId.toString();
    DataSourceTemplate.createWithContext("IpfsContent", [hash], context);

  } else {
    ape.owner = event.params.to.toHexString()
    ape.lastTrasnfer = event.block.timestamp
    ape.save()
  }

  entity.save()
}
