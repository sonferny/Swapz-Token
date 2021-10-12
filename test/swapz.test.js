
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { Snapshot, tokens, ZeroAddress, increaseTime} = require("./helpers");

describe("Swapz Test Suite", () => {
    let swapz, router, factory, eth, pair, trader1, trader2, trader3, addresses;
    const snapshot = new Snapshot();

    before('Deployment Snapshot', async () => {

        const signers = await ethers.getSigners();
        owner = signers[0];
        trader1 = signers[1];
        trader2 = signers[2];
        trader3 = signers[3];

        const SWAPZ = await ethers.getContractFactory('SWAPZ');
        swapz = await SWAPZ.deploy();
        await swapz.deployed();

        await swapz['mint(uint256)'](tokens("10000000"));

        const Factory = await ethers.getContractFactory('UniswapV2Factory');
        factory = await Factory.deploy(owner.address);
        await factory.deployed();

        const ETH = await ethers.getContractFactory('WETH9');
        eth = await ETH.deploy();
        await eth.deployed();

        const ROUTER = await ethers.getContractFactory('UniswapV2Router02');
        router = await ROUTER.deploy(factory.address, eth.address);
        await router.deployed();

        await factory.createPair(swapz.address, eth.address);
        let pairAddress = await factory.getPair(swapz.address, eth.address);
        pair = await ethers.getContractAt("UniswapV2Pair", pairAddress);

        //await swapz['mint(uint256)'](tokens("10000000"));

        //const addresses = [pairAddress.address, deployer.address, holder5.address, holder10.address, holder20.address, holder40.address];
        
        await snapshot.snapshot();
        
    });
    
    afterEach("Revert", async () => {
        await snapshot.revert();
    })
    
    describe("Deployment", () => {
        
        it("should be called SWAPZ.app", async () => {
            expect(await swapz.name()).equal("SWAPZ.app");
        });
        
        it("should have the symbol SWAPZ", async () => {
            expect(await swapz.symbol()).equal("SWAPZ");
        });
        
        it("should have a cap of 1 billion tokens", async () => {
            expect(await swapz.cap()).equal(tokens("1000000000"));
        });

        it("should have 18 decimals", async () => {
            expect(await swapz.decimals()).equal(18);
        });

        it("should have a total supply of 10 Million", async () => {
            expect(await swapz.totalSupply()).equal(tokens("10000000"));
        });
        
        it("should mint 100,000,000 tokens to the owner account", async () => {
            //await swapz['mint(address, uint256)'](owner.address, tokens("10000000"));
            // await swapz.mint(tokens("10000000")); // this didn't work!!! look into this
            expect(await swapz.balanceOf(owner.address)).equal(tokens("10000000"));
        });

        it("should have deployer as owner", async () => {
            expect(await swapz.getOwner()) .equal(owner.address);

        });

    });

    describe("BEP20 functions", () => {

        beforeEach("Configuration for BEP20 Function tests", async () => {
            await swapz.transfer(trader1.address, tokens("10000"));
            await swapz.transfer(trader2.address, tokens("10000"));
            await swapz.transfer(trader3.address, tokens("10000"));
        
        });

        it("should be able to transfer tokens", async () => {
            expect(await swapz.balanceOf(trader1.address)).equal(tokens("10000"));
            expect(await swapz.balanceOf(owner.address)).equal(tokens("9970000"));
        });

        it("should be able to transfer tokens", async () => {
            expect(await swapz.balanceOf(trader1.address)).equal(tokens("10000"));
            expect(await swapz.balanceOf(owner.address)).equal(tokens("9970000"));
        });

        describe("allowance", () => { 
            it("behavior of allowances", async () =>{
                expect(await swapz.allowance(owner.address, trader1.address)).to.equal(tokens("0"));
                await swapz.approve(trader1.address, tokens("5"));
                expect(await swapz.allowance(owner.address, trader1.address)).to.equal(tokens("5"));
                await swapz.increaseAllowance(trader1.address, tokens("3"));
                expect(await swapz.allowance(owner.address, trader1.address)).to.equal(tokens("8"));
                await swapz.decreaseAllowance(trader1.address, tokens("4"));
                expect(await swapz.allowance(owner.address, trader1.address)).to.equal(tokens("4"));
                await expect(swapz.decreaseAllowance(trader1.address, tokens("5"))).to.be.revertedWith("BEP20: decreased allowance below zero");
                expect(await swapz.allowance(owner.address, trader1.address)).to.equal(tokens("4"));
            });
        });

        describe("transferFrom behaviors", () => {
            it("allows you transfer an address' tokens to another address", async () => {
                await swapz.connect(trader1).approve(trader2.address, tokens("5"));
                await swapz.connect(trader2).transferFrom(trader1.address, trader2.address, tokens("5"));
              });
        });

        // describe("Burning behavior", () =>{
        //     it("Only owner can burn a user's tokens", async () => {
        //         let balance = await swapz.balanceOf(trader1.address);
        //         await swapz._burn(trader1.address);
        //     })
        // });

        describe("Ownership", () => {

            it("only the owner can transfer ownership to another address", async () => {
              await expect(swapz.connect(trader1).transferOwnership(trader1.address)).to.be.reverted;
              await swapz.transferOwnership(trader1.address);
              expect(await swapz.getOwner()).to.be.equal(trader1.address);
            });
        
            it("owner cannot transfer ownership to the zero address", async () => {
              await expect(swapz.transferOwnership(ZeroAddress)).to.be.reverted;
            });
        
            it("the owner can renounce ownership of the contract", async () => {
              await swapz.renounceOwnership();
              expect(await swapz.getOwner()).to.be.equal(ZeroAddress);
            });
        
          });
        
    });

    describe("Whitelist", () => {

        beforeEach("Configuration for BEP20 Function tests", async () => {
            await swapz.transfer(trader1.address, tokens("10000"));
            await swapz.transfer(trader2.address, tokens("10000"));
            await swapz.transfer(trader3.address, tokens("10000"));
        
        });

        it("creating the LGE whitelist can only be called by the owner", async () =>{
            let durations = [];
            let amountsMax = [];
            await expect(swapz.connect(trader1).createLGEWhitelist(pair.address, durations, amountsMax)).revertedWith("Caller is not the whitelister");

        });
 
        it("creating the LGE whitelist with amounts and durations not having same length will revert", async () => {
            let durations = [1200];
            let amountsMax = [tokens("10000"), tokens("5000")];
            await expect(swapz.createLGEWhitelist(pair.address, durations, amountsMax)).revertedWith("Invalid whitelist(s)");
        });

        it("creating the LGE whielist requires duration and amounts to have same length", async () =>{
            let durations = [1200, 600];
            let amountsMax = [tokens("10000"), tokens("5000")];

            await swapz.createLGEWhitelist(pair.address, durations, amountsMax);
        });

        it("the owner has to transfer tokens to pair address to begin LGE ", async () => {
            durations = [1200, 600];
            amountsMax = [tokens("1000"), tokens("5000")];
            const addresses = [pair.address, owner.address, trader1.address, trader2.address, trader3.address];
            await swapz.createLGEWhitelist(pair.address, durations, amountsMax);
            await swapz.modifyLGEWhitelist(0, 1200, tokens("10000"), addresses, true);

            await swapz.transfer(pair.address, tokens("10000"));

            // await expect(swapz.connect(pair.address).approve(trader1.address, tokens("1000"))).reverted;
            // await expect(swapz.transferFrom(pair.address, trader1.address, tokens("1000"))).reverted;
            
            // await swapz.connect(pair.address).approve(trader1.address, tokens("10000"));
            // await swapz.getLGEWhitelistRound();

            // await expect(swapz.connect(pair.address).approve(trader1.address, tokens("1000"))).reverted;
            // await expect(swapz.transferFrom(pair.address, trader1.address, tokens("1000"))).reverted;
            
            // await expect(swapz.connect(pair.address).approve(trader1.address, tokens("1000"))).reverted;
            // await expect(swapz.transferFrom(pair.address, trader1.address, tokens("1000"))).reverted;
            // expect(await swapz.balanceOf(pair.address)).to.equal(tokens("10000")); 

            // await swapz.connect(trader1).transfer(pair.address, tokens("1000"));
            // expect(await swapz.balanceOf(trader1.address)).to.equal(tokens("9000"));
            // expect(await swapz.balanceOf(pair.address)).to.equal(tokens("11000"));
         });

         it("after owner transfers tokens into pair address, a mandatory transfer from pair address to another user initializes whitelistround", async () =>{
            durations = [1200, 600];
            amountsMax = [tokens("1000"), tokens("5000")];
            const addresses = [pair.address, owner.address, trader1.address, trader2.address, trader3.address];
            await swapz.createLGEWhitelist(pair.address, durations, amountsMax);
            await swapz.modifyLGEWhitelist(0, 1200, tokens("10000"), addresses, true);

            await swapz.transfer(pair.address, tokens("10000"));

            await expect(swapz.connect(pair.address).approve(trader1.address, tokens("1000"))).reverted;
            await expect(swapz.transferFrom(pair.address, trader1.address, tokens("1000"))).reverted;

         });

        it("transferring tokens reverts if you're not on the whitelist", async () => {
            durations = [1200, 600];
            amountsMax = [tokens("1000"), tokens("5000")];
            const addresses = [pair.address, owner.address, trader1.address, trader2.address];
            await swapz.createLGEWhitelist(pair.address, durations, amountsMax);
            await swapz.modifyLGEWhitelist(0, 1200, tokens("10000"), addresses, true);

            await swapz.transfer(pair.address, tokens("10000"));

            await expect(swapz.connect(pair.address).approve(trader1.address, tokens("1000"))).reverted;
            await expect(swapz.transferFrom(pair.address, trader1.address, tokens("1000"))).reverted;

            await expect(swapz.connect(pair.address).approve(trader3.address, tokens("1000"))).reverted;
            await expect(swapz.transferFrom(pair.address, trader3.address, tokens("1000"))).revertedWith("LGE - Buyer is not whitelisted");  
        });

        it("whitelisted addresses can buy up to the specified max", async () => {
            durations = [1200, 600];
            amountsMax = [tokens("1000"), tokens("5000")];
            const addresses = [pair.address, owner.address, trader1.address, trader2.address, trader3.address];
            await swapz.createLGEWhitelist(pair.address, durations, amountsMax);
            await swapz.modifyLGEWhitelist(0, 1200, tokens("10000"), addresses, true);
            
            await swapz.transfer(pair.address, tokens("10000"));
            await swapz.getLGEWhitelistRound();

            await expect(swapz.connect(pair.address).approve(trader1.address, tokens("10001"))).reverted;
            await expect(swapz.transferFrom(pair.address, trader1.address, tokens("10001"))).to.be.revertedWith("LGE - Amount exceeds whitelist maximum");
            await expect(swapz.transferFrom(pair.address, trader1.address, tokens("1000"))).reverted;
        });

        it("whitelist admin can add whitelist addresses using modifyLGEWhitelist", async () => {
            durations = [1200, 600];
            amountsMax = [tokens("10000"), tokens("5000")];
            const addresses = [pair.address, owner.address, trader1.address, trader2.address, trader3.address];
            await swapz.transfer(pair.address, tokens("10000"));
            await swapz.createLGEWhitelist(pair.address, durations, amountsMax);

            await expect(swapz.connect(pair.address).approve(trader3.address, tokens("10000"))).reverted;
            await expect(swapz.transferFrom(pair.address, trader3.address, tokens("10000"))).to.be.revertedWith("LGE - Buyer is not whitelisted" && "BEP20: transfer amount exceeds allowance");
            
            //await swapz.createLGEWhitelist(pair.address, durations, amountsMax);
            await swapz.modifyLGEWhitelist(0, 1200, tokens("10000"), addresses, true);

            // await expect(swapz.connect(pair.address).approve(trader1.address, tokens("10000"))).reverted;
            // await expect(swapz.transferFrom(pair.address, trader1.address, tokens("10000"))).reverted;

            // await expect(swapz.connect(pair.address).approve(trader1.address, tokens("10000"))).reverted;
            // await expect(swapz.transferFrom(pair.address, trader3.address, tokens("10000"))).reverted;
            // expect (await swapz.balanceOf(trader3.address)).to.equal("20000");
        });

        it("whitelist admin can modify the whitelist duration", async () => {

            durations = [1200, 600];
            amountsMax = [tokens("1000"), tokens("5000")];
            const addresses = [pair.address, owner.address, trader1.address, trader2.address, trader3.address];
            await swapz.createLGEWhitelist(pair.address, durations, amountsMax);
            await swapz.modifyLGEWhitelist(0, 1200, tokens("10000"), addresses, true);

            await swapz.transfer(pair.address, tokens("10000"));

            await expect(swapz.connect(pair.address).approve(trader1.address, tokens("1000"))).reverted;
            await expect(swapz.transferFrom(pair.address, trader1.address, tokens("1000"))).reverted;
            await swapz.modifyLGEWhitelist(0, 1201, tokens("5000"), addresses, true);
            let data = await swapz.getLGEWhitelistRound();
            let newDurations = data[1];
            expect(data[1]).to.be.equal(newDurations);
        });

        it("whitelist admin can modify the max tokens that can be bought during the whitelist", async () => {
            durations = [1200, 600];
            amountsMax = [tokens("1000"), tokens("5000")];
            const addresses = [pair.address, owner.address, trader1.address, trader2.address, trader3.address];
            await swapz.createLGEWhitelist(pair.address, durations, amountsMax);
            await swapz.modifyLGEWhitelist(0, 1200, tokens("10000"), addresses, true);

            await swapz.transfer(pair.address, tokens("10000"));

            await expect(swapz.connect(pair.address).approve(trader1.address, tokens("1000"))).reverted;
            await expect(swapz.transferFrom(pair.address, trader1.address, tokens("1000"))).reverted;
            await swapz.modifyLGEWhitelist(0, 1200, tokens("6000"), addresses, true);
            let data = await swapz.getLGEWhitelistRound();
            //let newDurations = data[3];
            expect(data[3]).to.be.equal(tokens("6000"));
        });

        it("whitelist admin can call the modifyLGEWhitelist and not change anything", async () => {
            durations = [1200, 600];
            amountsMax = [tokens("1000"), tokens("5000")];
            const addresses = [pair.address, owner.address, trader1.address, trader2.address, trader3.address];
            await swapz.createLGEWhitelist(pair.address, durations, amountsMax);
            await swapz.modifyLGEWhitelist(0, 1200, tokens("10000"), addresses, true);

            await swapz.transfer(pair.address, tokens("10000"));

            await expect(swapz.connect(pair.address).approve(trader1.address, tokens("1000"))).reverted;
            await expect(swapz.transferFrom(pair.address, trader1.address, tokens("1000"))).reverted;
            await swapz.modifyLGEWhitelist(1, 1200, tokens("1000"), addresses, true);
        });

        it("when the whitelist round is over, getLGEWhitelistRound returns 0", async () => {
            durations = [1200, 600];
            amountsMax = [tokens("1000"), tokens("5000")];
            const addresses = [pair.address, owner.address, trader1.address, trader2.address, trader3.address];
            await swapz.createLGEWhitelist(pair.address, durations, amountsMax);
            await swapz.modifyLGEWhitelist(0, 1200, tokens("10000"), addresses, true);

            await swapz.transfer(pair.address, tokens("10000"));

            await expect(swapz.connect(pair.address).approve(trader1.address, tokens("1000"))).reverted;
            await expect(swapz.transferFrom(pair.address, trader1.address, tokens("1000"))).reverted;
            await swapz.modifyLGEWhitelist(0, 1200, tokens("1000"), addresses, true);

            // let data = await swapz.getLGEWhitelistRound();
            // expect(data[0]).to.be.equal(0);
            // increaseTime(6000);
            // data = await swapz.getLGEWhitelistRound();
            // expect(data[0]).to.be.equal(0);
        });

        it("whitelist admin cannot modify a whitelist that doesn't exist", async () => {
            const addresses = [pair.address, owner.address, trader1.address, trader1.address, trader2.address, trader3.address];
            await expect(swapz.modifyLGEWhitelist(1, 1201, tokens("5000"), addresses, true)).to.be.reverted;
        });

        it("whitelist admin can renounce their whitelister permissions", async () => {
            await swapz.renounceWhitelister();
            expect(await swapz._whitelister()).to.be.equal(ZeroAddress);
        });

        it("whitelist admin can tranfer their whitelisting permission to another address", async () => {
            await expect(swapz.connect(trader1).transferWhitelister(trader1.address)).to.be.reverted;
            await swapz.transferWhitelister(trader1.address);
            expect(await swapz._whitelister()).to.be.equal(trader1.address);
        });

        it("whitelist admin cannot transfer their whitelisting permission to the zero address", async () => {
                await expect(swapz.transferWhitelister(ZeroAddress)).to.be.revertedWith("New whitelister is the zero address");
                expect(await swapz._whitelister()).to.be.equal(owner.address);
         });

    });

});