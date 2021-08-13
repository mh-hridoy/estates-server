/* eslint-disable no-unused-vars */
const mongoose = require('mongoose');

const Schema = mongoose.Schema;


const propertySchema = new Schema({

    propertyAddress: {
        type: String,
        required: true,
    },
    city: String,
    county: String,
    state: {
        type: String,
        default: "",
        enum: ["North Carolina", "South Carolina"]
    },
    zip: Number,
    lotSqf: Number,
    totalSqf: Number,
    costPerSqf: Number,
    totalLivingSQF: Number,
    mainFloor: Number,
    secondFloor: Number,
    thirdFloor: Number,
    yearBuilt: Number,
    bed: Number,
    bath: Number,
    fullBath: Number,
    halfBath: Number,
    oneThirdBath: Number,
    basement: Number,
    finishedBasement: Number,
    finishedAttic: Number,
    garages: Number,
    garageType: String,
    garageSqf: Number,
    enclosedPorch: Number,
    family: Number,
    kitchen: Number,
    fireplace: { type: Boolean, default: false },
    subdivision: String,
    PropertyDescription: String,
    legalDesc: String,
    extWall: String,
    roofing: String,
    ac: String,
    heating: String,
    poolSpa: String,
    stories: Number,
    propertyType: String,
    specificPropertyType: String,
    buildingStyle: String,
    parcelId: String,
    countyValue: Number,
    prcURL: String,
    countyAssessorURL: String,
    gisURL: String,
    treasurerURL: String,
    taxBillUrl: String,

    infoTabFile: {
        fileName: String,
        uploadedAt: Date,
        postedBy: String,
    },
    zillowURL: String,
    zestimate: Number,
    redfinUrl: String,
    redfinEst: Number,
    realtorURL: String,
    realtorEst: Number,
    truliaURL: String,
    truliaEst: Number,
    harUrl: String,
    harEst: Number,
    beenVerifiedURL: String,
    priceHistory: [
        {
            _id: false,
            date: Date,
            price: Number,
            costPerSqf: Number,
            source: String,
            Description: String,
        }
    ],

    schoolsAndNeighbors: {
        elementarySchool: {
            name: String,
            ranking: String,
            distance: String,
        },

        middleSchool: {
            name: String,
            ranking: String,
            distance: String,
        },
        highSchool: {
            name: String,
            ranking: String,
            distance: String,
        }
    },
    assesmentAndTaxes: [
        {
            _id: false,
            propertyTaxOwed: Number,
            owedYear: Number,
            taxAssessed: Number,
            taxYear: Number
        }
    ],

    countyRODURL: String,
    manualSearch: { type: Boolean, default: false },
    noActiveMortgageLien: { type: Boolean, default: false },
    mortgageInfo: [
        {
            _id: false,
            lienForeclosing: { type: Boolean, default: false },
            noSTR: { type: Boolean, default: false },
            defectiveLien: { type: Boolean, default: false },
            note: String,

            lender: String,
            lienAmount: Number,
            dateRecorded: Date,
            instrument: String,
            dtBookPage: String,
            assignmentBookPage: String,
            loanType: String,
            loanTerm: String,
            maturityDate: Date,
            rightToCure: Number,
            tursteeFee: Number,
            trustee: String,
            strBookPage: String,
            strDate: Date,
            loanEstimatedBalance: Number,
            estLatePaymentAndFees: Number,
            totalEstimatedDebt: Number,
            cmaArv: Number,
            totalDebt: Number,
            legalDescMatch: { type: Boolean, default: false },
            propertyAddressMatch: { type: Boolean, default: false },
            resonableFees: { type: Boolean, default: false },
            amortizationView: {
                type: { type: Boolean, default: false },
                annualInterestRate: Number,
                monthlyPayment: Number,
                monthlyPrincipalPayment: Number,
                monthlyInterestPayment: Number,
                estimatedEquity: Number,
            },
            modA: {
                type: { type: Boolean, default: false },
                modABookPage: String,
                modADate: Date,
                modALienAmount: Number,
                modALoanTerm: String,
                modAmaturityDate: Date,
                annualInterestRate: Number,
                monthlyPayment: Number,
                loanEstBalance: Number,
                estLatePaymentAndFees: Number,
                totalEstimatedDebt: Number,
                cmaArv: Number,
            },
            subA: {
                type: { type: Boolean, default: false },
                subABookPage: String,
                subADate: Date,
                lienPosition: String
            },
            foreclosureResult: {
                type: { type: Boolean, default: false },
                trDeedInstrument: String,
                trDeedDate: Date,
                winningBidder: String,
                winningbid: Number,

            },
            document: {
                type: String,
                docType: String,
                otherName: String,
                caseNo: String,
                recordedDate: Date,

            },
            propertySignature: {
                owner1: { type: Boolean, default: false },
                owner2: { type: Boolean, default: false },
                owner3: { type: Boolean, default: false },
                owner4: { type: Boolean, default: false },
                dtcFirstCheck: {
                    type: { type: Boolean, default: false },
                    user: {
                        name: String,
                        checkedAt: Date
                    }
                },
                dcaSecondCheck: {
                    type: { type: Boolean, default: false },
                    user: {
                        name: String,
                        checkedAt: Date
                    }
                },
                dcaFinalCheck: {
                    type: { type: Boolean, default: false },
                    user: {
                        name: String,
                        checkedAt: Date
                    }
                }

            }
        },

    ],
    hoaLien: {
        lienForeclosing: { type: Boolean, default: false },
        noSTR: { type: Boolean, default: false },
        defectiveLien: { type: Boolean, default: false },
        manualSearch: { type: Boolean, default: false },
        note: String,

        hoaName: String,
        hoaLienAmount: Number,
        hoaLienDate: Date,
        instrument: String,
        dtBookPage: String,
        trusteeHoa: String,
        totalDebt: Number,
        strDate: Date,
        strBookPage: String,
        ccAndRsInstrument: String,
        ccAndRsDate: Date,
        hoaLienPriority: String,


        foreclosureResult: {
            type: { type: Boolean, default: false },
            trDeedInstrument: String,
            trDeedDate: Date,
            winningBidder: String,
            winningbid: Number,

        },
        redemptionInfo: {
            type: { type: Boolean, default: false },
            affidavitDate: Date,
            taxCode: String,
            redemptionExpires: Date,
            redeemedByOwner: { type: Boolean, default: false },
            redemptionNoticeInst: String,
            redemptionDate: Date,

        },
        document: {
            type: String,
            docType: String,
            otherName: String,
            caseNo: String,
            recordedDate: Date,

        },
        propertySignature: {
            owner1: { type: Boolean, default: false },
            owner2: { type: Boolean, default: false },
            owner3: { type: Boolean, default: false },
            owner4: { type: Boolean, default: false },
            dtcFirstCheck: {
                type: { type: Boolean, default: false },
                user: {
                    name: String,
                    checkedAt: Date
                }
            },
            dcaSecondCheck: {
                type: { type: Boolean, default: false },
                user: {
                    name: String,
                    checkedAt: Date
                }
            },
            dcaFinalCheck: {
                type: { type: Boolean, default: false },
                user: {
                    name: String,
                    checkedAt: Date
                }
            }

        }
    },
    taxLien: {
        lienForeclosing: { type: Boolean, default: false },
        defectiveLien: { type: Boolean, default: false },


        plaintiff: String,
        judgmentAmount: Number,
        judgmentDate: Date,
        bpOrInstrument: String,
        case: String,
        sheriffOrConstable: String,

        foreclosureResult: {
            type: { type: Boolean, default: false },
            trDeedInstrument: String,
            trDeedDate: Date,
            winningBidder: String,
            winningbid: Number,

        },
        redemptionInfo: {
            type: { type: Boolean, default: false },
            affidavitDate: Date,
            taxCode: String,
            redemptionExpires: Date,
            redeemedByOwner: { type: Boolean, default: false },
            redemptionNoticeInst: String,
            redemptionDate: Date,

        },
        document: {
            type: String,
            docType: String,
            otherName: String,
            caseNo: String,
            recordedDate: Date,

        },
        propertySignature: {
            owner1: { type: Boolean, default: false },
            owner2: { type: Boolean, default: false },
            owner3: { type: Boolean, default: false },
            owner4: { type: Boolean, default: false },
            dtcFirstCheck: {
                type: { type: Boolean, default: false },
                user: {
                    name: String,
                    checkedAt: Date
                }
            },
            dcaSecondCheck: {
                type: { type: Boolean, default: false },
                user: {
                    name: String,
                    checkedAt: Date
                }
            },
            dcaFinalCheck: {
                type: { type: Boolean, default: false },
                user: {
                    name: String,
                    checkedAt: Date
                }
            }

        }
    },

    ownerInfo: [
        {
            _id: false,
            sameOwner: { type: Boolean, default: false },
            pacer: { type: Boolean, default: false },

            ownerFullName: String,
            ownerAddress: String,
            ownerEmail: String,
            ownerPhone: String,
            pacerUrl: String,
            beenVerifiedURL: String,
            note: String,
        }
    ],
    borrowerInfo: [{
        _id: false,
        sameAsOwner: { type: Boolean, default: false },
        addressSameAsOwner: { type: Boolean, default: false },
        borrowerName: String,
        borrowerAddress: String,
        borrowerEmail: String,
        borrowerPhone: Number,
        notes: String
    }],
    OwnerDocs: {
        type: String,
        docType: String,
        otherName: String,
        caseNo: String,
        recordedDate: Date,

    },

    saleinfo: [
        {
            saleDate: Date,
            caseNumber: String,
            openingBid: Number,
            saleType: String,
            saleStatus: String,
            salePlace: String,
            saleTime: String,
            truesteeFile: String,
            precinct: Number,
            trustee: String,
            trusteeUrl: String,
            trusteeAddress: String,
            trusteePhone: String,
            trusteeHours: String,
            noticeOfForclosure: String,
            legalNoticeURL: String,
            datePulled: Date,
            book: String,
            page: String,
            imBy: String,
            imByDate: Date,
            nosName: String,
            nosDate: Date,
            auctionUrl: String,
            auctionDate: String,
            saleInfoDocs: {
                type: String,
                docType: String,
                otherName: String,
                caseNo: String,
                recordedDate: Date,

            },
            beforeSaleNotes: String,
            afterSaleNotes: String,

            firstBidderInfo: {
                nameOfBidder: String,
                bidAmount: Number,

                nameOfPurchaser: String,
                isWinningBidder: { type: Boolean },

                amountOfBid: Number,
                bidDate: Date,
                ldub: Date,
                minAmountOfNextBid: Number,
                depositRequiredToIpset: Number,
                address: String,
                phone: String,
                email: String,
                fax: String,
                dateOfReport: Date,
                nameOfMortgage: String,
                cryer: String,
                imby: String,
                imByDate: Date,
                bidConfirmed: { type: Boolean },
                bidUpset: { type: Boolean },
                auction: String,
                nosName: String,
                nosDate: Date,
                imCheckedBy: String,
                imCheckerDate: Date,
                notes: String,
                createdAt: Date,

                documents: {
                    docType: String,
                    otherName: String,
                    uploadedDate: Date,
                    uloadedBy: String

                }
            },
            otherBidderInfo: [
                {
                    isWinningBidder: { type: Boolean },
                    nameOfUpsetBidder: String,
                    addressOfUpsetBidder: String,
                    cityOfUpsetBidder: String,
                    upsetBidderZipCode: Number,
                    phone: String,
                    email: String,

                    amountOfBid: Number,
                    bidDate: Date,
                    lastDateForNextUb: Date,
                    depositWithTheClerk: Number,
                    minAmountOfNextUb: Number,
                    nameOfAttorneyOrAgent: String,
                    addressofAttorneyOrAgent: String,
                    cityOfAttorneyOrAgent: String,
                    zipCode: Number,
                    phoneNumber: String,
                    dateOfFilling: Date,
                    Notes: String,
                    imby: String,
                    imByDate: Date,
                    createdAt: Date,
                    auction: String,
                    nosName: String,
                    nosDate: Date,
                    imCheckedBy: String,
                    imCheckerDate: Date,

                    deputyCSC: { type: Boolean },
                    assistantCSC: { type: Boolean },
                    clerkOfSuperiorCourt: { type: Boolean },
                    documents: {
                        docType: String,
                        otherName: String,
                        uploadedDate: Date,
                        uloadedBy: String
                    }


                }
            ]

        }

    ],

    geo: {
        lat: String,
        long: String,

    },

    image: {
        type: String
    },

    cmaArvNotes: String,

    amEmail: { type: [String] },

    firstComp: {
        SSD: String,
        GSD: String,
        ADOM: Number,
        adomDate: [
            {
                _id: false,

                start: Date,
                end: Date
            }
        ],
        phaseOfRenovation: String,
        priceSqfOnSaleComp: Number,
        LastPriceSqfOnSaleComp: Number,
        saleCompsAndSSDMaps: String,
        GSDSaleCompMaps: String,
        rentGSD: Number,
        priceSqfOnSoldComp: Number,
        LastPriceSqfOnSoldComp: Number,
        SSDSoldCompMaps: String,
        GSDSoldCompMaps: String,
        rentalCompsAndMaps: String,
        pOneValue: Number,
        pTwoValue: Number,
        pThreeValue: Number,
        rentalRate: Number,
        compURL: String,
        compURLTwo: String,
        compURLThree: String,
        compURLFour: String,
        recommendedCMA: Number,
        wholeTailValue: Number,
        firstDTC: String,
        date: Date,
        note: String,

    },
    secondComp: {
        SSD: String,
        GSD: String,
        ADOM: Number,
        adomDate: [
            {
                _id: false,

                start: Date,
                end: Date
            }
        ],
        phaseOfRenovation: String,
        priceSqfOnSaleComp: Number,
        saleCompsAndSSDMaps: String,
        GSDSaleCompMaps: String,
        rentGSD: Number,
        priceSqfOnSoldComp: Number,
        GSDSoldCompMaps: String,
        rentalCompsAndMaps: String,
        pOneValue: Number,
        pTwoValue: Number,
        pThreeValue: Number,
        rentalRate: Number,
        compURL: String,
        compURLTwo: String,
        compURLThree: String,
        compURLFour: String,
        recommendedCMA: Number,
        wholeTailValue: Number,
        secondDCA: String,
        date: Date,
        note: String,

    },
    thirdComp: {
        SSD: String,
        GSD: String,
        ADOM: Number,
        adomDate: [
            {
                _id: false,

                start: Date,
                end: Date
            }
        ],
        phaseOfRenovation: String,
        priceSqfOnSaleComp: Number,
        saleCompsAndSSDMaps: String,
        GSDSaleCompMaps: String,
        rentGSD: Number,
        priceSqfOnSoldComp: Number,
        GSDSoldCompMaps: String,
        rentalCompsAndMaps: String,
        pOneValue: Number,
        pTwoValue: Number,
        pThreeValue: Number,
        rentalRate: Number,
        compURL: String,
        compURLTwo: String,
        compURLThree: String,
        compURLFour: String,
        recommendedCMA: Number,
        wholeTailValue: Number,
        thirdDCA: String,
        date: Date,
        note: String,
    }
}, { timestamps: true })

propertySchema.pre(/^find/, function (next) {
    this.select('-__v -createdAt -updatedAt')

    next()
})

propertySchema.pre('save', function (next) {
    //first check if it contains firstBidderinfo. If yes and user is adding other bid info then make winningBidder to the firsBidderInfo to false and add winningBidder feld to true to the current bidder that user updated . if user is adding the firstBidderinfo then make it true. 

    const saleInfoArray = this.saleinfo
    const lastSaleInfo = saleInfoArray[saleInfoArray.length - 1]
    const lastOtherBidInfo = lastSaleInfo.otherBidderInfo[lastSaleInfo.otherBidderInfo.length - 1]
    const allOtherBidInfo = lastSaleInfo.otherBidderInfo

    // saleinfo firstBidderInfo setup

    //if there's only one saleinfo array and no other bid info then.
    if (saleInfoArray.length === 1 && allOtherBidInfo.length === 0) {
        if (lastSaleInfo.firstBidderInfo.nameOfPurchaser && lastSaleInfo.firstBidderInfo.amountOfBid) {
            lastSaleInfo.firstBidderInfo.isWinningBidder = true
        }
        //if there's only one saleinfo array with otherbid info then.
    } else if (saleInfoArray.length === 1 && allOtherBidInfo.length !== 0) {
        lastSaleInfo.firstBidderInfo.isWinningBidder = false
        if (allOtherBidInfo.length === 1) {
            allOtherBidInfo.map((info) => { return info.isWinningBidder = true })
        } else if (allOtherBidInfo.length > 1) {
            const selectOtheBidExceptLastOne = allOtherBidInfo.slice(0, -1)
            selectOtheBidExceptLastOne.map((info) => { return info.isWinningBidder = false })
            lastOtherBidInfo.isWinningBidder = true
        }

        //if there's not only one saleinfo then.   **CHECK THE CHANGEFIELD FILE FOR MORE INFO
    } else if (saleInfoArray.length > 1) {
        const selectExceptLastOne = saleInfoArray.slice(0, -1)
        if (selectExceptLastOne.length !== 0) {
            selectExceptLastOne.map(info => {
                const selectAllOtherBidder = info.otherBidderInfo
                selectAllOtherBidder.map((info) => { return info.isWinningBidder = false })
                info.firstBidderInfo.isWinningBidder = false

                return info //return info array because map require return an new array in order to be able to create and submit changed array
            })
            //
        }
        //CODE HERE FOR THE 
        if (lastSaleInfo.otherBidderInfo.length === 0 && lastSaleInfo.firstBidderInfo.nameOfPurchaser && lastSaleInfo.firstBidderInfo.amountOfBid) {
            lastSaleInfo.firstBidderInfo.isWinningBidder = true;

        } else if (lastSaleInfo.otherBidderInfo.length === 1) {
            lastSaleInfo.firstBidderInfo.isWinningBidder = false;

            lastSaleInfo.otherBidderInfo.map((info) => { return info.isWinningBidder = true })
        } else if (lastSaleInfo.otherBidderInfo.length > 1) {
            lastSaleInfo.firstBidderInfo.isWinningBidder = false;
            const selectExceptLastOne = lastSaleInfo.otherBidderInfo.slice(0, -1)

            selectExceptLastOne.map(info => { return info.isWinningBidder = false })

            lastOtherBidInfo.isWinningBidder = true
        }

    }
    console.log(lastSaleInfo)

    next()
})

module.exports = mongoose.model('Property', propertySchema)