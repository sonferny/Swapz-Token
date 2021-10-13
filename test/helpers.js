
const ZeroAddress = ethers.constants.AddressZero;
const maxInt = ethers.constants.MaxUint256;

function ether(n) {
    return ethers.utils.parseEther(n);
}

function tokens(n) {
    return ethers.utils.parseUnits(n, 18);
}

async function increaseTime(n) {

    await hre.network.provider.request({
        method: "evm_increaseTime",
        params: [n]
    });

    await hre.network.provider.request({
        method: "evm_mine",
        params: []
    });

}

const timeLimit = (n) => {
    return Math.floor(Date.now() / 1000 + n);
  }

class Snapshot {
    constructor() {
        this.snapshotId = 0;
    }

    async revert() {
        await network.provider.send('evm_revert', [this.snapshotId]);
        return this.snapshot();
    }

    async snapshot() {
        this.snapshotId = await network.provider.send('evm_snapshot', []);
    }
}


module.exports = {
    maxInt, ZeroAddress,
    ether, tokens, increaseTime,
    Snapshot,
    timeLimit
};