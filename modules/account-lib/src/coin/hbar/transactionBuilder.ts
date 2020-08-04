import { BaseCoin as CoinConfig } from '@bitgo/statics/dist/src/base';
import BigNumber from 'bignumber.js';
import { BaseTransactionBuilder } from '../baseCoin';
import {
  BuildTransactionError,
  InvalidParameterValueError,
  ParseTransactionError,
  SigningError,
} from '../baseCoin/errors';
import { BaseAddress, BaseFee, BaseKey } from '../baseCoin/iface';
import { proto } from '../../../resources/hbar/protobuf/hedera';
import { Transaction } from './transaction';
import { getCurrentTime, isValidAddress, isValidTimeString, toUint8Array } from './utils';
import { KeyPair } from './keyPair';
import { SignatureData } from './ifaces';

export abstract class TransactionBuilder extends BaseTransactionBuilder {
  protected _fee: BaseFee;
  protected _transaction: Transaction;
  protected _source: BaseAddress;
  protected _startTime: proto.ITimestamp;
  protected _multiSignerKeyPairs: KeyPair[];
  protected _signatures: SignatureData[];

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._transaction = new Transaction(_coinConfig);
    this._multiSignerKeyPairs = [];
    this._signatures = [];
  }

  // region Base Builder
  /** @inheritdoc */
  protected fromImplementation(rawTransaction: Uint8Array | string): Transaction {
    this.transaction = new Transaction(this._coinConfig);
    let buffer;
    if (typeof rawTransaction === 'string') {
      buffer = toUint8Array(rawTransaction);
    } else {
      buffer = rawTransaction;
    }
    this.transaction.bodyBytes(buffer);
    this.initBuilder(this.transaction);
    return this.transaction;
  }

  /** @inheritdoc */
  protected signImplementation(key: BaseKey): Transaction {
    this.checkDuplicatedKeys(key);
    const signer = new KeyPair({ prv: key.key });

    // Signing the transaction is an operation that relies on all the data being set,
    // so we set the source here and leave the actual signing for the build step
    this._multiSignerKeyPairs.push(signer);
    return this.transaction;
  }

  protected initBuilder(tx: Transaction) {
    const txData = tx.toJson();
    this.fee({ fee: txData.fee.toString() });
    this.source({ address: txData.from });
    this.startTime(txData.startTime);
  }

  /**
   * Creates an Hedera TransactionID
   *
   * @returns {proto.TransactionID} - created TransactionID
   */
  protected buildTxId(): proto.TransactionID {
    const accString = this._source.address.split('.').pop();
    const acc = new BigNumber(accString!).toNumber();
    return new proto.TransactionID({
      transactionValidStart: this.validStart,
      accountID: { accountNum: acc },
    });
  }
  // endregion

  // region Common builder methods
  /**
   * Set the transaction fees
   *
   * @param {BaseFee} fee The maximum gas to pay
   * @returns {TransactionBuilder} This transaction builder
   */
  fee(fee: BaseFee): this {
    this.validateValue(new BigNumber(fee.fee));
    this._fee = fee;
    return this;
  }

  /**
   * Set the transaction source
   *
   * @param {BaseAddress} address The source account
   * @returns {TransactionBuilder} This transaction builder
   */
  source(address: BaseAddress): this {
    this.validateAddress(address);
    this._source = address;
    return this;
  }

  /**
   * Set an external transaction signature
   *
   * @param signature Hex encoded signature string
   * @param keyPair The public key keypair that was used to create the signature
   * @returns This transaction builder
   */
  signature(signature: string, keyPair: KeyPair): this {
    // if we already have a signature for this key pair, just update it
    for (const oldSignature of this._signatures) {
      if (oldSignature.keyPair.getKeys().pub === keyPair.getKeys().pub) {
        oldSignature.signature = signature;
        return this;
      }
    }

    // otherwise add the new signature
    this._signatures.push({ signature, keyPair });
    return this;
  }

  /**
   * Set the start time
   *
   * @param {string} time string value of the time to set with format <seconds>.<nanos>
   * @returns {TransactionBuilder} this
   */
  startTime(time: string): this {
    if (!isValidTimeString(time)) {
      throw new InvalidParameterValueError('invalid value for time parameter');
    }
    const timeParts = time.split('.').map(v => new BigNumber(v).toNumber());
    this._startTime = { seconds: timeParts[0], nanos: timeParts[1] };
    return this;
  }
  // endregion

  // region Getters and Setters
  private get validStart(): proto.ITimestamp {
    if (!this._startTime) {
      this.startTime(getCurrentTime());
    }
    return this._startTime;
  }

  /** @inheritdoc */
  protected get transaction(): Transaction {
    return this._transaction;
  }

  /** @inheritdoc */
  protected set transaction(transaction: Transaction) {
    this._transaction = transaction;
  }
  // endregion

  // region Validators
  /** @inheritdoc */
  validateAddress(address: BaseAddress, addressFormat?: string): void {
    if (!isValidAddress(address.address)) {
      throw new BuildTransactionError('Invalid address ' + address.address);
    }
  }

  /** @inheritdoc */
  validateKey(key: BaseKey): void {
    if (!new KeyPair({ prv: key.key })) {
      throw new BuildTransactionError('Invalid key');
    }
  }

  /** @inheritdoc */
  validateRawTransaction(rawTransaction: any): void {
    if (
      !(
        (typeof rawTransaction === 'string' && /^[0-9a-fA-F]+$/.test(rawTransaction)) ||
        (Buffer.isBuffer(rawTransaction) && Uint8Array.from(rawTransaction))
      )
    ) {
      throw new ParseTransactionError('Invalid raw transaction');
    }
  }

  /** @inheritdoc */
  validateTransaction(transaction?: Transaction): void {
    this.validateMandatoryFields();
  }

  /** @inheritdoc */
  validateValue(value: BigNumber): void {
    if (value.isLessThan(0)) {
      throw new BuildTransactionError('Value cannot be less than zero');
    }
  }

  validateMandatoryFields(): void {
    if (this._fee === undefined) {
      throw new BuildTransactionError('Invalid transaction: missing fee');
    }
    if (this._source === undefined) {
      throw new BuildTransactionError('Invalid transaction: missing source');
    }
  }

  /**
   * Validates that the given key is not already in this._multiSignerKeyPairs
   *
   * @param {BaseKey} key - The key to check
   */
  private checkDuplicatedKeys(key: BaseKey) {
    this._multiSignerKeyPairs.forEach(_sourceKeyPair => {
      if (_sourceKeyPair.getKeys().prv === key.key) {
        throw new SigningError('Repeated sign: ' + key.key);
      }
    });
  }
  // endregion
}