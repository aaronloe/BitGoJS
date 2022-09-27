import * as sinon from 'sinon';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import * as testData from '../fixtures/sol';
import * as should from 'should';
import * as resources from '../resources/sol';
import * as _ from 'lodash';
import { KeyPair, Sol, Tsol } from '../../src';
import { TssUtils, TxRequest, Wallet } from '@bitgo/sdk-core';
import { getBuilderFactory } from './getBuilderFactory';
import { Transaction } from '../../src/lib';
import { coins } from '@bitgo/statics';

describe('SOL:', function () {
  let bitgo: TestBitGoAPI;
  let basecoin: Sol;
  let keyPair;
  let newTxPrebuild;
  let newTxPrebuildTokenTransfer;
  let newTxParams;
  let newTxParamsWithError;
  let newTxParamsWithExtraData;
  let newTxParamsTokenTransfer;
  const badAddresses = resources.addresses.invalidAddresses;
  const goodAddresses = resources.addresses.validAddresses;

  const keypair = {
    pub: resources.accountWithSeed.publicKey,
    prv: resources.accountWithSeed.privateKey.base58,
  };
  const txPrebuild = {
    recipients: [
      {
        address: 'lionteste212',
        amount: '1000',
      },
    ],
    txBase64: resources.TRANSFER_UNSIGNED_TX_WITH_MEMO_AND_DURABLE_NONCE,
    txInfo: {
      feePayer: '5hr5fisPi6DXNuuRpm5XUbzpiEnmdyxXuBDTwzwZj5Pe',
      nonce: 'GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi',
    },
    txid: '586c5b59b10b134d04c16ac1b273fe3c5529f34aef75db4456cd469c5cdac7e2',
    isVotingTransaction: false,
    coin: 'tsol',
  };
  const txParams = {
    txPrebuild,
    recipients: [
      {
        address: 'CP5Dpaa42RtJmMuKqCQsLwma5Yh3knuvKsYDFX85F41S',
        amount: '300000',
      },
    ],
  };
  const memo = { value: 'test memo' };
  const durableNonce = {
    walletNonceAddress: '8Y7RM6JfcX4ASSNBkrkrmSbRu431YVi9Y3oLFnzC2dCh',
    authWalletAddress: '5hr5fisPi6DXNuuRpm5XUbzpiEnmdyxXuBDTwzwZj5Pe',
  };
  const errorDurableNonce = {
    walletNonceAddress: '8YM6JfcX4ASSNBkrkrmSbRu431YVi9Y3oLFnzC2dCh',
    authWalletAddress: '5hr5fisPi6DXNuuRpm5XUbzpiEnmdyxXuBDTwzwZj5Pe',
  };
  const txParamsWithError = {
    txPrebuild,
    recipients: [
      {
        address: 'CP5Dpaa42mMuKqCQsLwma5Yh3knuvKsYDFX85F41S',
        amount: '300000',
      },
    ],
  };
  const txParamsWithExtraData = {
    txPrebuild,
    recipients: [
      {
        address: 'CP5Dpaa42RtJmMuKqCQsLwma5Yh3knuvKsYDFX85F41S',
        amount: '300000',
        data: undefined,
      },
    ],
  };
  const txPrebuildTokenTransfer = {
    recipients: [
      {
        address: 'AF5H6vBkFnJuVqChRPgPQ4JRcQ5Gk25HBFhQQkyojmvg',
        amount: '1',
      },
    ],
    txHex: resources.TOKEN_TRANSFER_TO_NATIVE_UNSIGNED_TX_HEX,
    txInfo: {
      feePayer: '4DujymUFbQ8GBKtAwAZrQ6QqpvtBEivL48h4ta2oJGd2',
      nonce: 'GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi',
    },
    txid: '586c5b59b10b134d04c16ac1b273fe3c5529f34aef75db4456cd469c5cdac7e2',
    isVotingTransaction: false,
    coin: 'tsol',
  };
  const txParamsTokenTransfer = {
    txPrebuild,
    recipients: [
      {
        address: 'AF5H6vBkFnJuVqChRPgPQ4JRcQ5Gk25HBFhQQkyojmvg',
        amount: '1',
      },
    ],
  };
  const errorMemo = { value: 'different memo' };
  const errorFeePayer = '5hr5fisPi6DXCuuRpm5XUbzpiEnmdyxXuBDTwzwZj5Pe';
  const factory = getBuilderFactory('tsol');
  const wallet = new KeyPair(resources.authAccount).getKeys();
  const stakeAccount = new KeyPair(resources.stakeAccount).getKeys();
  const blockHash = resources.blockHashes.validBlockHashes[0];
  const amount = '10000';
  const validator = resources.validator;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('sol', Tsol.createInstance);
    bitgo.safeRegister('tsol', Tsol.createInstance);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('tsol') as Tsol;
    keyPair = basecoin.generateKeyPair(resources.accountWithSeed.seed);
    newTxPrebuild = () => {
      return _.cloneDeep(txPrebuild);
    };
    newTxPrebuildTokenTransfer = () => {
      return _.cloneDeep(txPrebuildTokenTransfer);
    };
    newTxParams = () => {
      return _.cloneDeep(txParams);
    };
    newTxParamsWithError = () => {
      return _.cloneDeep(txParamsWithError);
    };
    newTxParamsWithExtraData = () => {
      return _.cloneDeep(txParamsWithExtraData);
    };
    newTxParamsTokenTransfer = () => {
      return _.cloneDeep(txParamsTokenTransfer);
    };
  });

  it('should instantiate the coin', async function () {
    let localBasecoin = bitgo.coin('tsol');
    localBasecoin.should.be.an.instanceof(Tsol);

    localBasecoin = bitgo.coin('sol');
    localBasecoin.should.be.an.instanceof(Sol);

    console.log(
      await basecoin.recover({
        userKey: testData.keys.userKey,
        backupKey: testData.keys.backupKey,
        bitgoKey: testData.keys.bitgoKey,
        recoveryDestination: '3EJt66Hwfi22FRU2HWPet7faPRstiSdGxrEe486CxhTL',
        walletPassphrase: 't3stSicretly!',
        durableNoncePK: '6LqY5ncj7s4b1c3YJV1hsn2hVPNhEfvDCNYMaCc1jJhX',
        durableNonceSK:
          '447272d65cc8b39f88ea23b5f16859bd84b3ecfd6176ef99535efab37541c83b051a34bc8acd438763976f96876115050f73828553566d111d7ac8bffebf587c',
      })
    );
  });

  it('should retun the right info', function () {
    basecoin.getChain().should.equal('tsol');
    basecoin.getFamily().should.equal('sol');
    basecoin.getFullName().should.equal('Testnet Solana');
    basecoin.getBaseFactor().should.equal(1000000000);
  });
  describe('verify transactions', () => {
    const walletData = {
      id: '5b34252f1bf349930e34020a00000000',
      coin: 'tsol',
      keys: [
        '5b3424f91bf349930e34017500000000',
        '5b3424f91bf349930e34017600000000',
        '5b3424f91bf349930e34017700000000',
      ],
      coinSpecific: {
        rootAddress: wallet.pub,
      },
      multisigType: 'tss',
    };
    const walletObj = new Wallet(bitgo, basecoin, walletData);

    it('should verify transactions', async function () {
      const txParams = newTxParams();
      const txPrebuild = newTxPrebuild();
      const validTransaction = await basecoin.verifyTransaction({
        txParams,
        txPrebuild,
        memo,
        durableNonce,
        wallet: walletObj,
      } as any);
      validTransaction.should.equal(true);
    });

    it('should verify consolidate transaction', async function () {
      const txParams = newTxParams();
      const txPrebuild = newTxPrebuild();
      txPrebuild.consolidateId = 'consolidateId';

      const walletData = {
        id: '5b34252f1bf349930e34020a00000000',
        coin: 'tsol',
        keys: [
          '5b3424f91bf349930e34017500000000',
          '5b3424f91bf349930e34017600000000',
          '5b3424f91bf349930e34017700000000',
        ],
        coinSpecific: {
          rootAddress: stakeAccount.pub,
        },
        multisigType: 'tss',
      };
      const walletWithDifferentAddress = new Wallet(bitgo, basecoin, walletData);

      const validTransaction = await basecoin.verifyTransaction({
        txParams,
        txPrebuild,
        memo,
        durableNonce,
        wallet: walletWithDifferentAddress,
      } as any);
      validTransaction.should.be.true();
    });

    it('should handle txBase64 and txHex interchangeably', async function () {
      const txParams = newTxParams();
      const txPrebuild = newTxPrebuild();
      txPrebuild.txHex = txPrebuild.txBase64;
      txPrebuild.txBase64 = undefined;
      const validTransaction = await basecoin.verifyTransaction({
        txParams,
        txPrebuild,
        memo,
        durableNonce,
        wallet: walletObj,
      } as any);
      validTransaction.should.equal(true);
    });

    it('should convert serialized hex string to base64', async function () {
      const txParams = newTxParams();
      const txPrebuild = newTxPrebuild();
      txPrebuild.txBase64 = Buffer.from(txPrebuild.txBase64, 'base64').toString('hex');
      const validTransaction = await basecoin.verifyTransaction({
        txParams,
        txPrebuild,
        memo,
        durableNonce,
        wallet: walletObj,
      } as any);
      validTransaction.should.equal(true);
    });

    it('should verify when input `recipients` is absent', async function () {
      const txParams = newTxParams();
      txParams.recipients = undefined;
      const txPrebuild = newTxPrebuild();
      const validTransaction = await basecoin.verifyTransaction({
        txParams,
        txPrebuild,
        memo,
        durableNonce,
        wallet: walletObj,
      } as any);
      validTransaction.should.equal(true);
    });

    it('should fail verify transactions when have different memo', async function () {
      const txParams = newTxParams();
      const txPrebuild = newTxPrebuild();
      await basecoin
        .verifyTransaction({ txParams, txPrebuild, memo: errorMemo, errorFeePayer, wallet: walletObj } as any)
        .should.be.rejectedWith('Tx memo does not match with expected txParams recipient memo');
    });

    it('should fail verify transactions when have different durableNonce', async function () {
      const txParams = newTxParams();
      const txPrebuild = newTxPrebuild();
      await basecoin
        .verifyTransaction({ txParams, txPrebuild, memo, errorDurableNonce, wallet: walletObj } as any)
        .should.be.rejectedWith('Tx durableNonce does not match with param durableNonce');
    });

    it('should fail verify transactions when have different feePayer', async function () {
      const txParams = newTxParams();
      const txPrebuild = newTxPrebuild();
      const walletData = {
        id: '5b34252f1bf349930e34020a00000000',
        coin: 'tsol',
        keys: [
          '5b3424f91bf349930e34017500000000',
          '5b3424f91bf349930e34017600000000',
          '5b3424f91bf349930e34017700000000',
        ],
        coinSpecific: {
          rootAddress: stakeAccount.pub,
        },
        multisigType: 'tss',
      };
      const walletWithDifferentAddress = new Wallet(bitgo, basecoin, walletData);

      await basecoin
        .verifyTransaction({ txParams, txPrebuild, memo, wallet: walletWithDifferentAddress } as any)
        .should.be.rejectedWith('Tx fee payer is not the wallet root address');
    });

    it('should fail verify transactions when have different recipients', async function () {
      const txParams = newTxParamsWithError();
      const txPrebuild = newTxPrebuild();
      await basecoin
        .verifyTransaction({ txParams, txPrebuild, memo, errorFeePayer, wallet: walletObj } as any)
        .should.be.rejectedWith('Tx outputs does not match with expected txParams recipients');
    });

    it('should succeed to verify token transaction with native address recipient', async function () {
      const txParams = newTxParamsTokenTransfer();
      const address = 'AF5H6vBkFnJuVqChRPgPQ4JRcQ5Gk25HBFhQQkyojmvg'; // Native SOL address
      txParams.recipients = [{ address, amount: '1', tokenName: 'tsol:usdc' }];
      const txPrebuild = newTxPrebuildTokenTransfer();
      const feePayerWalletData = {
        id: '5b34252f1bf349930e34020a00000000',
        coin: 'tsol',
        keys: [
          '5b3424f91bf349930e34017500000000',
          '5b3424f91bf349930e34017600000000',
          '5b3424f91bf349930e34017700000000',
        ],
        coinSpecific: {
          rootAddress: '4DujymUFbQ8GBKtAwAZrQ6QqpvtBEivL48h4ta2oJGd2',
        },
        multisigType: 'tss',
      };
      const feePayerWallet = new Wallet(bitgo, basecoin, feePayerWalletData);
      const validTransaction = await basecoin.verifyTransaction({
        txParams,
        txPrebuild,
        wallet: feePayerWallet,
      } as any);
      validTransaction.should.equal(true);
    });

    it('should succeed to verify token transaction with leading zero recipient amount', async function () {
      const txParams = newTxParamsTokenTransfer();
      const address = 'AF5H6vBkFnJuVqChRPgPQ4JRcQ5Gk25HBFhQQkyojmvg'; // Native SOL address
      txParams.recipients = [{ address, amount: '0001', tokenName: 'tsol:usdc' }];
      const txPrebuild = newTxPrebuildTokenTransfer();
      const feePayerWalletData = {
        id: '5b34252f1bf349930e34020a00000000',
        coin: 'tsol',
        keys: [
          '5b3424f91bf349930e34017500000000',
          '5b3424f91bf349930e34017600000000',
          '5b3424f91bf349930e34017700000000',
        ],
        coinSpecific: {
          rootAddress: '4DujymUFbQ8GBKtAwAZrQ6QqpvtBEivL48h4ta2oJGd2',
        },
        multisigType: 'tss',
      };
      const feePayerWallet = new Wallet(bitgo, basecoin, feePayerWalletData);
      const validTransaction = await basecoin.verifyTransaction({
        txParams,
        txPrebuild,
        wallet: feePayerWallet,
      } as any);
      validTransaction.should.equal(true);
    });

    it('should fail to verify token transaction with different recipient tokenName', async function () {
      const txParams = newTxParamsTokenTransfer();
      const address = 'AF5H6vBkFnJuVqChRPgPQ4JRcQ5Gk25HBFhQQkyojmvg'; // Native SOL address
      txParams.recipients = [{ address, amount: '1', tokenName: 'tsol:usdt' }]; // Different tokenName, should fail to verify tx
      const txPrebuild = newTxPrebuildTokenTransfer();
      await basecoin
        .verifyTransaction({
          txParams,
          txPrebuild,
          wallet: walletObj,
        } as any)
        .should.be.rejectedWith('Tx outputs does not match with expected txParams recipients');
    });

    it('should fail to verify token transaction with different recipient amounts', async function () {
      const txParams = newTxParamsTokenTransfer();
      const address = 'AF5H6vBkFnJuVqChRPgPQ4JRcQ5Gk25HBFhQQkyojmvg'; // Native SOL address
      txParams.recipients = [{ address, amount: '2', tokenName: 'tsol:usdt' }];
      const txPrebuild = newTxPrebuildTokenTransfer();
      await basecoin
        .verifyTransaction({
          txParams,
          txPrebuild,
          wallet: walletObj,
        } as any)
        .should.be.rejectedWith('Tx outputs does not match with expected txParams recipients');
    });

    it('should fail to verify token transaction with different native address', async function () {
      const txParams = newTxParamsTokenTransfer();
      const address = 'AF5H6vBkFnJuVqChRPgPQ4JRcQ5Gk25HBFhQQkyojmvX'; // Native SOL address, different than tx recipients
      txParams.recipients = [{ address, amount: '1', tokenName: 'tsol:usdc' }];
      const txPrebuild = newTxPrebuildTokenTransfer();
      await basecoin
        .verifyTransaction({
          txParams,
          txPrebuild,
          wallet: walletObj,
        } as any)
        .should.be.rejectedWith('Tx outputs does not match with expected txParams recipients');
    });

    it('should succeed to verify transactions when recipients has extra data', async function () {
      const txParams = newTxParamsWithExtraData();
      const txPrebuild = newTxPrebuild();
      const validTransaction = await basecoin.verifyTransaction({
        txParams,
        txPrebuild,
        memo,
        durableNonce,
        wallet: walletObj,
      } as any);
      validTransaction.should.equal(true);
    });

    it('should verify activate staking transaction', async function () {
      const tx = await factory
        .getStakingActivateBuilder()
        .stakingAddress(stakeAccount.pub)
        .sender(wallet.pub)
        .nonce(blockHash)
        .amount(amount)
        .validator(validator.pub)
        .memo('test memo')
        .fee({ amount: 5000 })
        .build();
      const txToBroadcastFormat = tx.toBroadcastFormat();
      const txParams = newTxParams();
      const txPrebuild = newTxPrebuild();
      txPrebuild.txBase64 = txToBroadcastFormat;
      txPrebuild.txInfo.nonce = '5ne7phA48Jrvpn39AtupB8ZkCCAy8gLTfpGihZPuDqen';
      txParams.recipients = [
        {
          address: '7dRuGFbU2y2kijP6o1LYNzVyz4yf13MooqoionCzv5Za',
          amount: amount,
        },
      ];
      const validTransaction = await basecoin.verifyTransaction({
        txParams,
        txPrebuild,
        memo,
        wallet: walletObj,
      } as any);
      validTransaction.should.equal(true);
    });

    it('should verify withdraw staking transaction', async function () {
      const tx = await factory
        .getStakingWithdrawBuilder()
        .stakingAddress(stakeAccount.pub)
        .sender(wallet.pub)
        .nonce(blockHash)
        .amount(amount)
        .memo('test memo')
        .fee({ amount: 5000 })
        .build();
      const txToBroadcastFormat = tx.toBroadcastFormat();
      const txParams = newTxParams();
      const txPrebuild = newTxPrebuild();
      txPrebuild.txBase64 = txToBroadcastFormat;
      txPrebuild.txInfo.nonce = '5ne7phA48Jrvpn39AtupB8ZkCCAy8gLTfpGihZPuDqen';
      txParams.recipients = [
        {
          address: '5hr5fisPi6DXNuuRpm5XUbzpiEnmdyxXuBDTwzwZj5Pe',
          amount: amount,
        },
      ];
      const validTransaction = await basecoin.verifyTransaction({
        txParams,
        txPrebuild,
        memo,
        wallet: walletObj,
      } as any);
      validTransaction.should.equal(true);
    });

    it('should verify deactivate staking transaction', async function () {
      const tx = await factory
        .getStakingDeactivateBuilder()
        .stakingAddress(stakeAccount.pub)
        .sender(wallet.pub)
        .nonce(blockHash)
        .memo('test memo')
        .fee({ amount: 5000 })
        .build();
      const txToBroadcastFormat = tx.toBroadcastFormat();
      const txParams = newTxParams();
      const txPrebuild = newTxPrebuild();
      txPrebuild.txBase64 = txToBroadcastFormat;
      txPrebuild.txInfo.nonce = '5ne7phA48Jrvpn39AtupB8ZkCCAy8gLTfpGihZPuDqen';
      txParams.recipients = [];
      const validTransaction = await basecoin.verifyTransaction({
        txParams,
        txPrebuild,
        memo,
        wallet: walletObj,
      } as any);
      validTransaction.should.equal(true);
    });

    it('should verify create associated token account transaction', async function () {
      const tx = await factory
        .getAtaInitializationBuilder()
        .mint('tsol:usdc')
        .sender(wallet.pub)
        .nonce(blockHash)
        .memo('test memo')
        .fee({ amount: 5000 })
        .build();
      const txToBroadcastFormat = tx.toBroadcastFormat();
      const txParams = newTxParams();
      const txPrebuild = newTxPrebuild();
      txPrebuild.txBase64 = txToBroadcastFormat;
      txPrebuild.txInfo.nonce = blockHash;
      txParams.recipients = [];
      const validTransaction = await basecoin.verifyTransaction({
        txParams,
        txPrebuild,
        memo,
        wallet: walletObj,
      } as any);
      validTransaction.should.equal(true);
    });
  });

  it('should accept valid address', function () {
    goodAddresses.forEach((addr) => {
      basecoin.isValidAddress(addr).should.equal(true);
    });
  });

  it('should reject invalid address', function () {
    badAddresses.forEach((addr) => {
      basecoin.isValidAddress(addr).should.equal(false);
    });
  });

  it('should check valid pub keys', function () {
    keyPair.should.have.property('pub');
    basecoin.isValidPub(keyPair.pub).should.equal(true);
  });

  it('should check an invalid pub keys', function () {
    const badPubKey = keyPair.pub.slice(0, keyPair.pub.length - 1) + '-';
    basecoin.isValidPub(badPubKey).should.equal(false);
  });

  it('should check valid prv keys', function () {
    keyPair.should.have.property('prv');
    basecoin.isValidPrv(keyPair.prv).should.equal(true);
  });

  it('should check an invalid prv keys', function () {
    const badPrvKey = keyPair.prv ? keyPair.prv.slice(0, keyPair.prv.length - 1) + '-' : undefined;
    basecoin.isValidPrv(badPrvKey as string).should.equal(false);
  });

  describe('Parse Transactions:', () => {
    it('should parse an unsigned transfer transaction', async function () {
      const parsedTransaction = await basecoin.parseTransaction({
        txBase64: testData.rawTransactions.transfer.unsigned,
        feeInfo: {
          fee: '5000',
        },
      });

      parsedTransaction.should.deepEqual({
        inputs: [
          {
            address: 'CP5Dpaa42RtJmMuKqCQsLwma5Yh3knuvKsYDFX85F41S',
            amount: 305000,
          },
        ],
        outputs: [
          {
            address: 'CP5Dpaa42RtJmMuKqCQsLwma5Yh3knuvKsYDFX85F41S',
            amount: '300000',
          },
        ],
      });
    });

    it('should parse a signed transfer transaction', async function () {
      const parsedTransaction = await basecoin.parseTransaction({
        txBase64: testData.rawTransactions.transfer.signed,
        feeInfo: {
          fee: '5000',
        },
      });

      parsedTransaction.should.deepEqual({
        inputs: [
          {
            address: 'CP5Dpaa42RtJmMuKqCQsLwma5Yh3knuvKsYDFX85F41S',
            amount: 305000,
          },
        ],
        outputs: [
          {
            address: 'CP5Dpaa42RtJmMuKqCQsLwma5Yh3knuvKsYDFX85F41S',
            amount: '300000',
          },
        ],
      });
    });

    it('should parse an unsigned wallet init transaction', async function () {
      const parsedTransaction = await basecoin.parseTransaction({
        txBase64: testData.rawTransactions.walletInit.unsigned,
        feeInfo: {
          fee: '5000',
        },
      });

      parsedTransaction.should.deepEqual({
        inputs: [
          {
            address: '8Y7RM6JfcX4ASSNBkrkrmSbRu431YVi9Y3oLFnzC2dCh',
            amount: 310000,
          },
        ],
        outputs: [
          {
            address: '8Y7RM6JfcX4ASSNBkrkrmSbRu431YVi9Y3oLFnzC2dCh',
            amount: '300000',
          },
        ],
      });
    });

    it('should parse a signed wallet init transaction', async function () {
      const parsedTransaction = await basecoin.parseTransaction({
        txBase64: testData.rawTransactions.walletInit.signed,
        feeInfo: {
          fee: '5000',
        },
      });

      parsedTransaction.should.deepEqual({
        inputs: [
          {
            address: '8Y7RM6JfcX4ASSNBkrkrmSbRu431YVi9Y3oLFnzC2dCh',
            amount: 310000,
          },
        ],
        outputs: [
          {
            address: '8Y7RM6JfcX4ASSNBkrkrmSbRu431YVi9Y3oLFnzC2dCh',
            amount: '300000',
          },
        ],
      });
    });

    it('should parse an unsigned transfer token transaction', async function () {
      const parsedTransaction = await basecoin.parseTransaction({
        txBase64: testData.rawTransactions.transferToken.unsigned,
        feeInfo: {
          fee: '5000',
        },
      });

      parsedTransaction.should.deepEqual({
        inputs: [
          {
            address: 'CP5Dpaa42RtJmMuKqCQsLwma5Yh3knuvKsYDFX85F41S',
            amount: 5000,
          },
        ],
        outputs: [
          {
            address: 'CP5Dpaa42RtJmMuKqCQsLwma5Yh3knuvKsYDFX85F41S',
            amount: '300000',
            tokenName: 'tsol:usdc',
          },
        ],
      });
    });

    it('should parse a signed transfer token transaction', async function () {
      const parsedTransaction = await basecoin.parseTransaction({
        txBase64: testData.rawTransactions.transferToken.signed,
        feeInfo: {
          fee: '5000',
        },
      });

      parsedTransaction.should.deepEqual({
        inputs: [
          {
            address: 'CP5Dpaa42RtJmMuKqCQsLwma5Yh3knuvKsYDFX85F41S',
            amount: 5000,
          },
        ],
        outputs: [
          {
            address: 'CP5Dpaa42RtJmMuKqCQsLwma5Yh3knuvKsYDFX85F41S',
            amount: '300000',
            tokenName: 'tsol:usdc',
          },
        ],
      });
    });
  });

  describe('Explain Transactions:', () => {
    it('should explain an unsigned transfer transaction', async function () {
      const explainedTransaction = await basecoin.explainTransaction({
        txBase64: testData.rawTransactions.transfer.unsigned,
        feeInfo: {
          fee: '5000',
        },
      });
      explainedTransaction.should.deepEqual({
        displayOrder: [
          'id',
          'type',
          'blockhash',
          'durableNonce',
          'outputAmount',
          'changeAmount',
          'outputs',
          'changeOutputs',
          'fee',
          'memo',
        ],
        id: 'UNAVAILABLE',
        type: 'Send',
        changeOutputs: [],
        changeAmount: '0',
        outputAmount: '300000',
        outputs: [
          {
            address: 'CP5Dpaa42RtJmMuKqCQsLwma5Yh3knuvKsYDFX85F41S',
            amount: '300000',
          },
        ],
        fee: {
          fee: '5000',
          feeRate: 5000,
        },
        memo: 'test memo',
        blockhash: 'GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi',
        durableNonce: {
          authWalletAddress: '5hr5fisPi6DXNuuRpm5XUbzpiEnmdyxXuBDTwzwZj5Pe',
          walletNonceAddress: '8Y7RM6JfcX4ASSNBkrkrmSbRu431YVi9Y3oLFnzC2dCh',
        },
      });
    });

    it('should explain a signed transfer transaction', async function () {
      const explainedTransaction = await basecoin.explainTransaction({
        txBase64: testData.rawTransactions.transfer.signed,
        feeInfo: {
          fee: '5000',
        },
      });
      explainedTransaction.should.deepEqual({
        displayOrder: [
          'id',
          'type',
          'blockhash',
          'durableNonce',
          'outputAmount',
          'changeAmount',
          'outputs',
          'changeOutputs',
          'fee',
          'memo',
        ],
        id: '2XFxGfXddKWnqGaMAsfNL8HgXqDvjBL2Ae28KWrRvg9bQBmCrpHYVDacuZFeAUyYwjXG6ey2jTARX5VQCnj7SF4L',
        type: 'Send',
        changeOutputs: [],
        changeAmount: '0',
        outputAmount: '300000',
        outputs: [
          {
            address: 'CP5Dpaa42RtJmMuKqCQsLwma5Yh3knuvKsYDFX85F41S',
            amount: '300000',
          },
        ],
        fee: {
          fee: '5000',
          feeRate: 5000,
        },
        memo: 'test memo',
        blockhash: 'GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi',
        durableNonce: {
          authWalletAddress: '5hr5fisPi6DXNuuRpm5XUbzpiEnmdyxXuBDTwzwZj5Pe',
          walletNonceAddress: '8Y7RM6JfcX4ASSNBkrkrmSbRu431YVi9Y3oLFnzC2dCh',
        },
      });
    });

    it('should explain an unsigned wallet init transaction', async function () {
      const explainedTransaction = await basecoin.explainTransaction({
        txBase64: testData.rawTransactions.walletInit.unsigned,
        feeInfo: {
          fee: '5000',
        },
      });

      explainedTransaction.should.deepEqual({
        displayOrder: [
          'id',
          'type',
          'blockhash',
          'durableNonce',
          'outputAmount',
          'changeAmount',
          'outputs',
          'changeOutputs',
          'fee',
          'memo',
        ],
        id: 'UNAVAILABLE',
        type: 'WalletInitialization',
        changeOutputs: [],
        changeAmount: '0',
        outputAmount: '300000',
        outputs: [
          {
            address: '8Y7RM6JfcX4ASSNBkrkrmSbRu431YVi9Y3oLFnzC2dCh',
            amount: '300000',
          },
        ],
        fee: {
          fee: '10000',
          feeRate: 5000,
        },
        blockhash: 'GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi',
        durableNonce: undefined,
        memo: undefined,
      });
    });

    it('should explain a signed wallet init transaction', async function () {
      const explainedTransaction = await basecoin.explainTransaction({
        txBase64: testData.rawTransactions.walletInit.signed,
        feeInfo: {
          fee: '5000',
        },
      });

      explainedTransaction.should.deepEqual({
        displayOrder: [
          'id',
          'type',
          'blockhash',
          'durableNonce',
          'outputAmount',
          'changeAmount',
          'outputs',
          'changeOutputs',
          'fee',
          'memo',
        ],
        id: '7TkU8wLgXDeLFbVydtg6mqMsp9GatsetitSngysgjxFhofKSUcLPBoKPHciLeGEfJFMsqezpZmGRSFQTBy7ZDsg',
        type: 'WalletInitialization',
        changeOutputs: [],
        changeAmount: '0',
        outputAmount: '300000',
        outputs: [
          {
            address: '8Y7RM6JfcX4ASSNBkrkrmSbRu431YVi9Y3oLFnzC2dCh',
            amount: '300000',
          },
        ],
        fee: {
          fee: '10000',
          feeRate: 5000,
        },
        blockhash: 'GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi',
        durableNonce: undefined,
        memo: undefined,
      });
    });

    it('should explain an unsigned token transfer transaction', async function () {
      const explainedTransaction = await basecoin.explainTransaction({
        txBase64: testData.rawTransactions.transferToken.unsigned,
        feeInfo: {
          fee: '5000',
        },
      });
      explainedTransaction.should.deepEqual({
        displayOrder: [
          'id',
          'type',
          'blockhash',
          'durableNonce',
          'outputAmount',
          'changeAmount',
          'outputs',
          'changeOutputs',
          'fee',
          'memo',
        ],
        id: 'UNAVAILABLE',
        type: 'Send',
        changeOutputs: [],
        changeAmount: '0',
        outputAmount: '0',
        outputs: [
          {
            address: 'CP5Dpaa42RtJmMuKqCQsLwma5Yh3knuvKsYDFX85F41S',
            amount: '300000',
            tokenName: 'tsol:usdc',
          },
        ],
        fee: {
          fee: '5000',
          feeRate: 5000,
        },
        memo: 'test memo',
        blockhash: 'GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi',
        durableNonce: {
          authWalletAddress: '12f6D3WubGVeQoH2m8kTvvcrasWdXWwtVzUCyRNDZxA2',
          walletNonceAddress: '8Y7RM6JfcX4ASSNBkrkrmSbRu431YVi9Y3oLFnzC2dCh',
        },
      });
    });

    it('should explain a signed token transfer transaction', async function () {
      const explainedTransaction = await basecoin.explainTransaction({
        txBase64: testData.rawTransactions.transferToken.signed,
        feeInfo: {
          fee: '5000',
        },
      });
      explainedTransaction.should.deepEqual({
        displayOrder: [
          'id',
          'type',
          'blockhash',
          'durableNonce',
          'outputAmount',
          'changeAmount',
          'outputs',
          'changeOutputs',
          'fee',
          'memo',
        ],
        id: '335sxAuVj5ucXqVWW82QwpFLArPbdD3gXfXr4KrxkLkUpmLB3Nwz2G82z2TqiDD7mNAAbHkcAqD5ycDZp1vVKtjf',
        type: 'Send',
        changeOutputs: [],
        changeAmount: '0',
        outputAmount: '0',
        outputs: [
          {
            address: 'CP5Dpaa42RtJmMuKqCQsLwma5Yh3knuvKsYDFX85F41S',
            amount: '300000',
            tokenName: 'tsol:usdc',
          },
        ],
        fee: {
          fee: '5000',
          feeRate: 5000,
        },
        memo: 'test memo',
        blockhash: 'GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi',
        durableNonce: {
          authWalletAddress: '12f6D3WubGVeQoH2m8kTvvcrasWdXWwtVzUCyRNDZxA2',
          walletNonceAddress: '8Y7RM6JfcX4ASSNBkrkrmSbRu431YVi9Y3oLFnzC2dCh',
        },
      });
    });

    it('should explain activate staking transaction', async function () {
      const tx = await factory
        .getStakingActivateBuilder()
        .stakingAddress(stakeAccount.pub)
        .sender(wallet.pub)
        .nonce(blockHash)
        .amount(amount)
        .validator(validator.pub)
        .memo('test memo')
        .fee({ amount: 5000 })
        .build();
      const txToBroadcastFormat = tx.toBroadcastFormat();
      const explainedTransaction = await basecoin.explainTransaction({
        txBase64: txToBroadcastFormat,
        feeInfo: {
          fee: '5000',
        },
      });
      explainedTransaction.should.deepEqual({
        displayOrder: [
          'id',
          'type',
          'blockhash',
          'durableNonce',
          'outputAmount',
          'changeAmount',
          'outputs',
          'changeOutputs',
          'fee',
          'memo',
        ],
        id: 'UNAVAILABLE',
        type: 'StakingActivate',
        changeOutputs: [],
        changeAmount: '0',
        outputAmount: '10000',
        outputs: [
          {
            address: '7dRuGFbU2y2kijP6o1LYNzVyz4yf13MooqoionCzv5Za',
            amount: '10000',
          },
        ],
        fee: {
          fee: '10000',
          feeRate: 5000,
        },
        memo: 'test memo',
        blockhash: '5ne7phA48Jrvpn39AtupB8ZkCCAy8gLTfpGihZPuDqen',
        durableNonce: undefined,
      });
    });

    it('should explain deactivate staking transaction', async function () {
      const tx = await factory
        .getStakingDeactivateBuilder()
        .stakingAddress(stakeAccount.pub)
        .sender(wallet.pub)
        .nonce(blockHash)
        .memo('test memo')
        .fee({ amount: 5000 })
        .build();
      const txToBroadcastFormat = tx.toBroadcastFormat();
      const explainedTransaction = await basecoin.explainTransaction({
        txBase64: txToBroadcastFormat,
        feeInfo: {
          fee: '5000',
        },
      });
      explainedTransaction.should.deepEqual({
        displayOrder: [
          'id',
          'type',
          'blockhash',
          'durableNonce',
          'outputAmount',
          'changeAmount',
          'outputs',
          'changeOutputs',
          'fee',
          'memo',
        ],
        id: 'UNAVAILABLE',
        type: 'StakingDeactivate',
        changeOutputs: [],
        changeAmount: '0',
        outputAmount: '0',
        outputs: [],
        fee: {
          fee: '5000',
          feeRate: 5000,
        },
        memo: 'test memo',
        blockhash: '5ne7phA48Jrvpn39AtupB8ZkCCAy8gLTfpGihZPuDqen',
        durableNonce: undefined,
      });
    });

    it('should explain withdraw staking transaction', async function () {
      const tx = await factory
        .getStakingWithdrawBuilder()
        .stakingAddress(stakeAccount.pub)
        .sender(wallet.pub)
        .nonce(blockHash)
        .amount(amount)
        .memo('test memo')
        .fee({ amount: 5000 })
        .build();
      const txToBroadcastFormat = tx.toBroadcastFormat();
      const explainedTransaction = await basecoin.explainTransaction({
        txBase64: txToBroadcastFormat,
        feeInfo: {
          fee: '5000',
        },
      });
      explainedTransaction.should.deepEqual({
        displayOrder: [
          'id',
          'type',
          'blockhash',
          'durableNonce',
          'outputAmount',
          'changeAmount',
          'outputs',
          'changeOutputs',
          'fee',
          'memo',
        ],
        id: 'UNAVAILABLE',
        type: 'StakingWithdraw',
        changeOutputs: [],
        changeAmount: '0',
        outputAmount: '10000',
        outputs: [
          {
            address: '5hr5fisPi6DXNuuRpm5XUbzpiEnmdyxXuBDTwzwZj5Pe',
            amount: '10000',
          },
        ],
        fee: {
          fee: '5000',
          feeRate: 5000,
        },
        memo: 'test memo',
        blockhash: '5ne7phA48Jrvpn39AtupB8ZkCCAy8gLTfpGihZPuDqen',
        durableNonce: undefined,
      });
    });

    it('should explain create ATA transaction', async function () {
      const tokenName = 'tsol:usdc';
      const rentExemptAmount = '3000000';
      const tx = await factory
        .getAtaInitializationBuilder()
        .sender(wallet.pub)
        .nonce(blockHash)
        .mint(tokenName)
        .rentExemptAmount(rentExemptAmount)
        .memo('test memo')
        .fee({ amount: 5000 })
        .build();
      const txToBroadcastFormat = tx.toBroadcastFormat();
      const explainedTransaction = await basecoin.explainTransaction({
        txBase64: txToBroadcastFormat,
        feeInfo: {
          fee: '5000',
        },
        tokenAccountRentExemptAmount: rentExemptAmount,
      });
      explainedTransaction.should.deepEqual({
        displayOrder: [
          'id',
          'type',
          'blockhash',
          'durableNonce',
          'outputAmount',
          'changeAmount',
          'outputs',
          'changeOutputs',
          'fee',
          'memo',
        ],
        id: 'UNAVAILABLE',
        type: 'AssociatedTokenAccountInitialization',
        changeOutputs: [],
        changeAmount: '0',
        outputAmount: rentExemptAmount,
        outputs: [
          {
            address: '141BFNem3pknc8CzPVLv1Ri3btgKdCsafYP5nXwmXfxU',
            amount: rentExemptAmount,
          },
        ],
        fee: {
          fee: '5000',
          feeRate: 5000,
        },
        memo: 'test memo',
        blockhash: '5ne7phA48Jrvpn39AtupB8ZkCCAy8gLTfpGihZPuDqen',
        durableNonce: undefined,
      });
    });

    it('should explain create multi ATA transaction', async function () {
      const recipients = [
        {
          ownerAddress: wallet.pub,
          tokenName: 'tsol:usdc',
        },
        {
          ownerAddress: durableNonce.walletNonceAddress,
          tokenName: 'tsol:ray',
        },
      ];
      const rentExemptAmount = '3000000';
      const tx = await factory
        .getAtaInitializationBuilder()
        .sender(wallet.pub)
        .nonce(blockHash)
        .enableToken(recipients[0])
        .enableToken(recipients[1])
        .rentExemptAmount(rentExemptAmount)
        .memo('test memo')
        .fee({ amount: 5000 })
        .build();
      const txToBroadcastFormat = tx.toBroadcastFormat();
      const explainedTransaction = await basecoin.explainTransaction({
        txBase64: txToBroadcastFormat,
        feeInfo: {
          fee: '5000',
        },
        tokenAccountRentExemptAmount: rentExemptAmount,
      });
      explainedTransaction.should.deepEqual({
        displayOrder: [
          'id',
          'type',
          'blockhash',
          'durableNonce',
          'outputAmount',
          'changeAmount',
          'outputs',
          'changeOutputs',
          'fee',
          'memo',
        ],
        id: 'UNAVAILABLE',
        type: 'AssociatedTokenAccountInitialization',
        changeOutputs: [],
        changeAmount: '0',
        outputAmount: '6000000',
        outputs: [
          {
            address: '141BFNem3pknc8CzPVLv1Ri3btgKdCsafYP5nXwmXfxU',
            amount: rentExemptAmount,
          },
          {
            address: '9KaLinZFNW5chL4J8UoKnTECppWVMz3ewgx4FAkxUDcf',
            amount: rentExemptAmount,
          },
        ],
        fee: {
          fee: '5000',
          feeRate: 5000,
        },
        memo: 'test memo',
        blockhash: '5ne7phA48Jrvpn39AtupB8ZkCCAy8gLTfpGihZPuDqen',
        durableNonce: undefined,
      });
    });
  });

  describe('Keypair:', () => {
    it('should generate a keypair from random seed', function () {
      should.throws(() => basecoin.generateKeyPair('placeholder' as any), 'generateKeyPair method not implemented');
    });

    it('should generate a keypair from a seed', function () {
      should.throws(() => basecoin.generateKeyPair('placeholder' as any), 'generateKeyPair method not implemented');
    });
  });

  describe('Sign transaction:', () => {
    it('should sign transaction', async function () {
      const signed: any = await basecoin.signTransaction({
        txPrebuild: {
          txBase64: resources.RAW_TX_UNSIGNED,
          keys: [resources.accountWithSeed.publicKey.toString()],
        },
        prv: resources.accountWithSeed.privateKey.base58,
      } as any);
      signed.txHex.should.equal(resources.RAW_TX_SIGNED);
    });

    it('should handle txHex and txBase64 interchangeably', async function () {
      const signed: any = await basecoin.signTransaction({
        txPrebuild: {
          txHex: resources.RAW_TX_UNSIGNED,
          keys: [resources.accountWithSeed.publicKey.toString()],
        },
        prv: resources.accountWithSeed.privateKey.base58,
      } as any);
      signed.txHex.should.equal(resources.RAW_TX_SIGNED);
    });

    it('should throw invalid transaction when sign with public key', async function () {
      await basecoin
        .signTransaction({
          txPrebuild: {
            txBase64: resources.RAW_TX_UNSIGNED,
            keys: [resources.accountWithSeed.publicKey.toString()],
          },
          prv: resources.accountWithSeed.publicKey,
        } as any)
        .should.be.rejectedWith('Invalid key');
    });
  });

  describe('Sign message', () => {
    it('should sign message', async function () {
      const signed = await basecoin.signMessage(keypair, 'signed message');
      signed
        .toString('base64')
        .should.equal('s+7d/8aW/twfM/0wLSKOGxd9+LhDIiz/g0FfJ39ylJhQIkjK0RYPm/Y+gdeJ5DIy6K6h6gCXXESDomlv12DBBQ==');
    });
    it('shouldnt sign message when message is undefined', async function () {
      await basecoin
        .signMessage(keypair, undefined as any)
        .should.be.rejectedWith(
          'The first argument must be of type string or an instance of Buffer, ArrayBuffer, or Array or an Array-like Object. Received undefined'
        );
    });
  });

  describe('Get Signing Payload', () => {
    it('should return a valid signing payload', async function () {
      const factory = getBuilderFactory(basecoin.getChain());
      const rebuiltSignablePayload = (await factory.from(resources.TRANSFER_UNSIGNED_TX_WITH_MEMO).build())
        .signablePayload;
      const signingPayload = await basecoin.getSignablePayload(resources.TRANSFER_UNSIGNED_TX_WITH_MEMO);
      signingPayload.should.be.deepEqual(rebuiltSignablePayload);
    });
  });

  describe('Presign transaction', () => {
    const txRequestId = 'txRequestId';
    let sandbox: sinon.SinonSandbox;

    beforeEach(() => {
      sandbox = sinon.createSandbox();
    });

    afterEach(() => {
      sandbox.verifyAndRestore();
    });

    it('should rebuild tx request for hot wallets', async () => {
      const rebuiltTx: TxRequest = {
        txRequestId,
        unsignedTxs: [
          {
            serializedTxHex: 'deadbeef',
            signableHex: 'serializedTxHex',
            derivationPath: 'm/0',
          },
        ],
        transactions: [],
        date: new Date().toISOString(),
        intent: {
          intentType: 'payment',
        },
        latest: true,
        state: 'pendingUserSignature',
        walletType: 'hot',
        walletId: 'walletId',
        policiesChecked: true,
        version: 1,
        userId: 'userId',
      };

      const stubTssUtils = sandbox.createStubInstance(TssUtils);
      stubTssUtils.deleteSignatureShares.resolves([]);
      stubTssUtils.getTxRequest.resolves(rebuiltTx);

      const hotWallet = {
        type: 'hot',
      };
      const presignedTransaction: any = await basecoin.presignTransaction({
        walletData: hotWallet,
        tssUtils: stubTssUtils,
        txPrebuild: {
          txRequestId,
        },
      } as any);

      presignedTransaction.walletData.should.deepEqual(hotWallet);
      presignedTransaction.txPrebuild.should.deepEqual(rebuiltTx);
      presignedTransaction.txHex.should.equal(rebuiltTx.unsignedTxs[0].serializedTxHex);
    });

    it('should do nothing for non-hot wallets', async () => {
      const coldWallet = {
        type: 'cold',
      };

      const presignedTransaction = await basecoin.presignTransaction({
        walletData: coldWallet,
      } as any);
      presignedTransaction.should.deepEqual({
        walletData: coldWallet,
      });
    });

    it('should error if txRequestId is missing', async () => {
      const hotWallet = {
        type: 'hot',
      };
      await basecoin
        .presignTransaction({
          walletData: hotWallet,
          txPrebuild: {},
        } as any)
        .should.rejectedWith('Missing txRequestId');
    });
  });

  describe('Recover Transactions:', () => {
    const sandBox = sinon.createSandbox();
    const coin = coins.get('tsol');

    beforeEach(() => {
      const callBack = sandBox.stub(Sol.prototype, 'getDataFromNode' as keyof Sol);

      callBack
        .withArgs({
          payload: {
            id: '1',
            jsonrpc: '2.0',
            method: 'getLatestBlockhash',
            params: [
              {
                commitment: 'finalized',
              },
            ],
          },
        })
        .resolves(testData.SolResponses.getBlockhashResponse);
      callBack
        .withArgs({
          payload: {
            id: '1',
            jsonrpc: '2.0',
            method: 'getFees',
          },
        })
        .resolves(testData.SolResponses.getFeesResponse);
      callBack
        .withArgs({
          payload: {
            id: '1',
            jsonrpc: '2.0',
            method: 'getBalance',
            params: [testData.accountInfo.bs58EncodedPublicKey],
          },
        })
        .resolves(testData.SolResponses.getAccountBalanceResponse);
      callBack
        .withArgs({
          payload: {
            id: '1',
            jsonrpc: '2.0',
            method: 'getAccountInfo',
            params: [
              testData.keys.durableNoncePubKey,
              {
                encoding: 'jsonParsed',
              },
            ],
          },
        })
        .resolves(testData.SolResponses.getAccountInfoResponse);
    });

    afterEach(() => {
      sandBox.restore();
    });

    it('should recover a txn for non-bitgo recoveries (latest blockhash)', async function () {
      // Latest Blockhash Recovery (BitGo-less)
      const latestBlockHashTxn = await basecoin.recover({
        userKey: testData.keys.userKey,
        backupKey: testData.keys.backupKey,
        bitgoKey: testData.keys.bitgoKey,
        recoveryDestination: testData.keys.destinationPubKey,
        walletPassphrase: testData.keys.walletPassword,
      });
      latestBlockHashTxn.should.not.be.empty();
      latestBlockHashTxn.should.hasOwnProperty('serializedTx');

      const latestBlockhashTxnDeserialize = new Transaction(coin);
      latestBlockhashTxnDeserialize.fromRawTransaction(latestBlockHashTxn.serializedTx);
      const latestBlockhashTxnJson = latestBlockhashTxnDeserialize.toJson();

      should.equal(latestBlockhashTxnJson.nonce, testData.SolInputData.blockhash);
      should.equal(latestBlockhashTxnJson.feePayer, testData.SolInputData.pubKey);
      should.equal(latestBlockhashTxnJson.numSignatures, testData.SolInputData.latestBlockhashSignatures);
    });

    it('should recover a txn for non-bitgo recoveries (durable nonce)', async function () {
      // Durable Nonce Recovery (BitGo-less)
      const durableNonceTxn = await basecoin.recover({
        userKey: testData.keys.userKey,
        backupKey: testData.keys.backupKey,
        bitgoKey: testData.keys.bitgoKey,
        recoveryDestination: testData.keys.destinationPubKey,
        walletPassphrase: testData.keys.walletPassword,
        durableNoncePK: testData.keys.durableNoncePubKey,
        durableNonceSK: testData.keys.durableNoncePrivKey,
      });

      durableNonceTxn.should.not.be.empty();
      durableNonceTxn.should.hasOwnProperty('serializedTx');

      const durableNonceTxnDeserialize = new Transaction(coin);
      durableNonceTxnDeserialize.fromRawTransaction(durableNonceTxn.serializedTx);
      const durableNonceTxnJson = durableNonceTxnDeserialize.toJson();

      should.equal(durableNonceTxnJson.nonce, testData.SolInputData.durableNonceBlockhash);
      should.equal(durableNonceTxnJson.feePayer, testData.SolInputData.pubKey);
      should.equal(durableNonceTxnJson.numSignatures, testData.SolInputData.durableNonceSignatures);
    });

    it('should recover a txn for unsigned sweep recoveries', async function () {
      // Unsigned Sweep Recovery
      const unsignedSweepTxn = await basecoin.recover({
        bitgoKey: testData.keys.bitgoKey,
        recoveryDestination: testData.keys.destinationPubKey,
        walletPassphrase: testData.keys.walletPassword,
        durableNoncePK: testData.keys.durableNoncePubKey,
        durableNonceSK: testData.keys.durableNoncePrivKey,
      });

      unsignedSweepTxn.should.not.be.empty();
      unsignedSweepTxn.should.hasOwnProperty('serializedTx');

      const unsignedSweepTxnDeserialize = new Transaction(coin);
      unsignedSweepTxnDeserialize.fromRawTransaction(unsignedSweepTxn.serializedTx);
      const unsignedSweepTxnJson = unsignedSweepTxnDeserialize.toJson();

      should.equal(unsignedSweepTxnJson.nonce, testData.SolInputData.durableNonceBlockhash);
      should.equal(unsignedSweepTxnJson.feePayer, testData.SolInputData.pubKey);
      should.equal(unsignedSweepTxnJson.numSignatures, testData.SolInputData.unsignedSweepSignatures);
    });
  });
});
