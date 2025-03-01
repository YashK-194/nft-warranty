const { expect } = require("chai");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { ethers } = require("hardhat");

describe("Warranty Contract", function () {
  let Warranty, warranty, owner, addr1, addr2;

  beforeEach(async function () {
    // Deploy the contract before each test
    [owner, addr1, addr2] = await ethers.getSigners();
    Warranty = await ethers.getContractFactory("Warranty");
    warranty = await Warranty.deploy();
    await warranty.waitForDeployment();
  });

  it("Should deploy the contract correctly", async function () {
    expect(await warranty.tokenCounter()).to.equal(0);
  });

  it("Should create a new warranty certificate", async function () {
    const tx = await warranty.createWarrantyCertificate(
      "Apple",
      "iPhone 15",
      "Electronics",
      1000,
      12,
      addr1.address,
      "A premium smartphone"
    );
    await tx.wait();

    const cert = await warranty.getCertificateInfo(0);
    expect(cert.brandName).to.equal("Apple");
    expect(cert.product).to.equal("iPhone 15");
    expect(cert.category).to.equal("Electronics");
    expect(cert.price).to.equal(1000);
    expect(cert.warrantyPeriod).to.equal(12);
    expect(cert.sellerAddress).to.equal(owner.address);
    expect(cert.buyerAddress).to.equal(addr1.address);
    expect(cert.description).to.equal("A premium smartphone");

    expect(await warranty.tokenCounter()).to.equal(1);
  });

  it("Should emit WarrantyCreated event", async function () {
    await expect(
      warranty.createWarrantyCertificate(
        "Samsung",
        "Galaxy S24",
        "Electronics",
        800,
        24,
        addr1.address,
        "Flagship smartphone"
      )
    )
      .to.emit(warranty, "WarrantyCreated")
      .withArgs(
        0,
        "Galaxy S24",
        owner.address,
        addr1.address,
        "Samsung",
        800,
        24,
        anyValue
      );
  });

  it("Should not allow warranty creation with invalid inputs", async function () {
    await expect(
      warranty.createWarrantyCertificate(
        "",
        "iPhone 15",
        "Electronics",
        1000,
        12,
        addr1.address,
        "Smartphone"
      )
    ).to.be.revertedWith("Brand name cannot be empty");

    await expect(
      warranty.createWarrantyCertificate(
        "Apple",
        "iPhone 15",
        "Electronics",
        1000,
        0,
        addr1.address,
        "Smartphone"
      )
    ).to.be.revertedWith("Warranty period must be positive");

    await expect(
      warranty.createWarrantyCertificate(
        "Apple",
        "iPhone 15",
        "Electronics",
        0,
        12,
        addr1.address,
        "Smartphone"
      )
    ).to.be.revertedWith("Price must be positive");
  });

  it("Should not allow warranty creation with zero buyer address", async function () {
    await expect(
      warranty.createWarrantyCertificate(
        "Apple",
        "iPhone 15",
        "Electronics",
        1000,
        12,
        ethers.ZeroAddress,
        "Smartphone"
      )
    ).to.be.revertedWith("Buyer address cannot be zero");
  });

  it("Should correctly check warranty validity", async function () {
    await warranty.createWarrantyCertificate(
      "Sony",
      "PlayStation 5",
      "Gaming",
      500,
      12, // 12-month warranty
      addr1.address,
      "Next-gen console"
    );

    expect(await warranty.isWarrantyValid(0)).to.equal(true);

    // Fast forward 13 months (in seconds)
    await ethers.provider.send("evm_increaseTime", [13 * 30 * 24 * 60 * 60]);
    await ethers.provider.send("evm_mine"); // Mine the next block

    expect(await warranty.isWarrantyValid(0)).to.equal(false);
  });

  it("Should revert if checking validity of non-existent certificate", async function () {
    await expect(warranty.isWarrantyValid(0)).to.be.revertedWith(
      "Certificate does not exist."
    );
  });

  it("Should set the correct NFT owner", async function () {
    await warranty.createWarrantyCertificate(
      "Apple",
      "iPhone 15",
      "Electronics",
      1000,
      12,
      addr1.address,
      "A premium smartphone"
    );
    expect(await warranty.ownerOf(0)).to.equal(owner.address);
  });

  it("Should allow warranty transfer between accounts", async function () {
    await warranty.createWarrantyCertificate(
      "Apple",
      "iPhone 15",
      "Electronics",
      1000,
      12,
      addr1.address,
      "A premium smartphone"
    );
    await warranty.transferFrom(owner.address, addr2.address, 0);
    expect(await warranty.ownerOf(0)).to.equal(addr2.address);
  });

  it("Should handle multiple warranty certificates", async function () {
    await warranty.createWarrantyCertificate(
      "Apple",
      "iPhone 15",
      "Electronics",
      1000,
      12,
      addr1.address,
      "A premium smartphone"
    );
    await warranty.createWarrantyCertificate(
      "Dell",
      "XPS 13",
      "Computers",
      1500,
      24,
      addr2.address,
      "Ultrabook laptop"
    );

    expect(await warranty.tokenCounter()).to.equal(2);
    const cert0 = await warranty.getCertificateInfo(0);
    const cert1 = await warranty.getCertificateInfo(1);

    expect(cert0.product).to.equal("iPhone 15");
    expect(cert1.product).to.equal("XPS 13");
    expect(cert0.buyerAddress).to.equal(addr1.address);
    expect(cert1.buyerAddress).to.equal(addr2.address);
  });

  it("Should correctly handle warranty at exact expiration", async function () {
    await warranty.createWarrantyCertificate(
      "Sony",
      "PlayStation 5",
      "Gaming",
      500,
      12,
      addr1.address,
      "Next-gen console"
    );

    // Fast forward exactly 12 months (in seconds)
    await ethers.provider.send("evm_increaseTime", [12 * 30 * 24 * 60 * 60]);
    await ethers.provider.send("evm_mine");

    // Should still be valid at exactly 12 months
    expect(await warranty.isWarrantyValid(0)).to.equal(true);

    // Fast forward one more second
    await ethers.provider.send("evm_increaseTime", [1]);
    await ethers.provider.send("evm_mine");

    // Should now be invalid
    expect(await warranty.isWarrantyValid(0)).to.equal(false);
  });

  it("Should allow different accounts to create warranties", async function () {
    await warranty
      .connect(addr1)
      .createWarrantyCertificate(
        "Samsung",
        "Galaxy S24",
        "Electronics",
        800,
        24,
        addr2.address,
        "Flagship smartphone"
      );

    const cert = await warranty.getCertificateInfo(0);
    expect(cert.sellerAddress).to.equal(addr1.address);
    expect(cert.buyerAddress).to.equal(addr2.address);
    expect(await warranty.ownerOf(0)).to.equal(addr1.address);
  });

  it("Should not allow warranty creation with an empty product name", async function () {
    await expect(
      warranty.createWarrantyCertificate(
        "Apple", // Valid brand
        "", // Empty product name
        "Electronics", // Valid category
        1000, // Valid price
        12, // Valid warranty period
        addr1.address, // Valid buyer address
        "Smartphone" // Valid description
      )
    ).to.be.revertedWith("Product name cannot be empty");
  });

  it("Should not allow warranty creation with an empty category", async function () {
    await expect(
      warranty.createWarrantyCertificate(
        "Apple", // Valid brand
        "iPhone 15", // Valid product name
        "", // Empty category
        1000, // Valid price
        12, // Valid warranty period
        addr1.address, // Valid buyer address
        "Smartphone" // Valid description
      )
    ).to.be.revertedWith("Category cannot be empty");
  });

  it("Should store different buyer addresses for different certificates", async function () {
    // First certificate with addr1 as buyer
    await warranty.createWarrantyCertificate(
      "Apple",
      "iPhone 15",
      "Electronics",
      1000,
      12,
      addr1.address,
      "Premium smartphone"
    );

    // Second certificate with addr2 as buyer
    await warranty.createWarrantyCertificate(
      "Samsung",
      "Galaxy S24",
      "Electronics",
      900,
      24,
      addr2.address,
      "Android flagship"
    );

    const cert0 = await warranty.getCertificateInfo(0);
    const cert1 = await warranty.getCertificateInfo(1);

    expect(cert0.buyerAddress).to.equal(addr1.address);
    expect(cert1.buyerAddress).to.equal(addr2.address);
  });

  it("Should maintain buyer address after NFT transfer", async function () {
    // Create certificate with addr1 as buyer
    await warranty.createWarrantyCertificate(
      "Apple",
      "MacBook Pro",
      "Computers",
      2000,
      36,
      addr1.address,
      "Professional laptop"
    );

    // Transfer NFT to addr2
    await warranty.transferFrom(owner.address, addr2.address, 0);

    // Check that ownership changed but buyer address remained the same
    expect(await warranty.ownerOf(0)).to.equal(addr2.address);
    const cert = await warranty.getCertificateInfo(0);
    expect(cert.buyerAddress).to.equal(addr1.address);
  });

  it("Should allow a seller to create warranty for themselves as buyer", async function () {
    await warranty.createWarrantyCertificate(
      "Custom",
      "Handmade Item",
      "Crafts",
      50,
      6,
      owner.address, // Same address as seller
      "Self-made product"
    );

    const cert = await warranty.getCertificateInfo(0);
    expect(cert.sellerAddress).to.equal(owner.address);
    expect(cert.buyerAddress).to.equal(owner.address);
  });
});
