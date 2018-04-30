import React, { Component } from "react";
import { ZebulonTable } from "../table/ZebulonTable";
import { functions } from "../table/MetaDescriptions";
import { functionsTable } from "../table/utils/compute.meta";
import { filtersFunction } from "../table/utils/filters.sorts";
export const get_thp = ({ params, meta, filters }) => {
	let data = Object.values(thirdparties);
	if (filters) {
		data = data.filter(filtersFunction(filters, params, data));
	}
	return new Promise(resolve => setTimeout(resolve, 20)).then(() => data);
};
// export const thirdparty = id => thirdparties[id];
export const metaThirdparties = {
	table: {
		object: "thirdparties",
		select: get_thp,
		filteredByServer: true,
		primaryKey: "id",
		caption: "Thirdparties",
		actions: [
			{ type: "insert", caption: "New", enable: true },
			{
				type: "delete",
				caption: "Delete",
				enable: "is_selected"
			},
			{
				type: "duplicate",
				caption: "Duplicate",
				enable: "is_selected"
			},
			{
				type: "save",
				caption: "Save",
				enable: true
			},
			{
				type: "refresh",
				caption: "Refresh",
				enable: true
			}
		]
	},
	row: {
		audit: undefined //"audit"
	},
	properties: [
		{
			id: "id",
			dataType: "number",
			mandatory: true,
			hidden: true
		},
		{
			id: "cd",
			caption: "Code",
			width: 100,
			dataType: "string"
		},
		{
			id: "lb",
			caption: "Name",
			width: 1100,
			dataType: "string"
		}
	]
};
export const getThirdparty = id => thirdparties[id];
export const thirdparties = [
	{
		id: 4936,
		cd: "FRC$F",
		lb:
			"FIRST REPUBLIC BANK Depositary Shares, each representing a 1/40th interest in a share of 5.70% Noncumulative Perpetual Series F Preferred Stock"
	},
	{ id: 1303, cd: "GTXI", lb: "GTx, Inc. - Common Stock" },
	{ id: 4717, cd: "EVRI", lb: "Everi Holdings Inc. Common Stock" },
	{
		id: 3836,
		cd: "CBO",
		lb: "CBO (Listing Market - NYSE - Networks A/E) Common Stock"
	},
	{ id: 905, cd: "EFUT", lb: "eFuture Holding Inc. - Ordinary Shares" },
	{
		id: 1680,
		cd: "LIND",
		lb: "Lindblad Expeditions Holdings Inc.  - Common Stock"
	},
	{ id: 135, cd: "AMAT", lb: "Applied Materials, Inc. - Common Stock" },
	{
		id: 5191,
		cd: "GS$I",
		lb: "Goldman Sachs Group, Inc. (The) Perpetual Preferred Series I"
	},
	{ id: 2212, cd: "PHII", lb: "PHI, Inc. - Voting Common Stock" },
	{
		id: 1952,
		cd: "NEPT",
		lb: "Neptune Technologies & Bioresources Inc - Ordinary Shares"
	},
	{
		id: 3116,
		cd: "ZAIS",
		lb: "ZAIS Group Holdings, Inc. - Class A Common Stock"
	},
	{
		id: 162,
		cd: "AMTD",
		lb: "TD Ameritrade Holding Corporation - Common Stock"
	},
	{
		id: 5003,
		cd: "GAB$D",
		lb: "Gabelli Equity Trust, Inc. (The) Preferred Stock Series D"
	},
	{ id: 3878, cd: "CEMB", lb: "iShares Emerging Markets Corporate Bond ETF" },
	{ id: 5087, cd: "GHM", lb: "Graham Corporation Common Stock" },
	{
		id: 2067,
		cd: "OHAI",
		lb: "OHA Investment Corporation - Closed End Fund"
	},
	{
		id: 4821,
		cd: "FEI",
		lb:
			"First Trust MLP and Energy Income Fund Common Shares of Beneficial Interest"
	},
	{ id: 1589, cd: "JUNO", lb: "Juno Therapeutics, Inc. - Common Stock" },
	{ id: 2168, cd: "PCCC", lb: "PC Connection, Inc. - Common Stock" },
	{ id: 4498, cd: "EFU", lb: "ProShares UltraShort MSCI EAFE" },
	{ id: 1832, cd: "MIDD", lb: "The Middleby Corporation - Common Stock" },
	{
		id: 4253,
		cd: "DEZU",
		lb: "iShares Adaptive Currency Hedged MSCI Eurozone ETF"
	},
	{ id: 35, cd: "ACLS", lb: "Axcelis Technologies, Inc. - Common Stock" },
	{ id: 1192, cd: "FYX", lb: "First Trust Small Cap Core AlphaDEX Fund" },
	{ id: 5661, cd: "IRL", lb: "New Ireland Fund, Inc (The) Common Stock" },
	{
		id: 3347,
		cd: "AMID",
		lb:
			"American Midstream Partners, LP Common Units representing Limited Partner Interests"
	},
	{ id: 2145, cd: "PACEU", lb: "Pace Holdings Corp. - Unit" },
	{ id: 2023, cd: "NVTR", lb: "Nuvectra Corporation - Common Stock" },
	{ id: 4453, cd: "ECNS", lb: "iShares MSCI China Small-Cap ETF" },
	{ id: 507, cd: "CEMI", lb: "Chembio Diagnostics, Inc. - Common Stock" },
	{
		id: 2143,
		cd: "PACB",
		lb: "Pacific Biosciences of California, Inc. - Common Stock"
	},
	{ id: 2511, cd: "SCZ", lb: "iShares MSCI EAFE Small-Cap ETF" },
	{ id: 1882, cd: "MRTN", lb: "Marten Transport, Ltd. - Common Stock" },
	{ id: 1457, cd: "IFON", lb: "InfoSonics Corp - Common Stock" },
	{ id: 5008, cd: "GAL", lb: "SPDR SSgA Global Allocation ETF" },
	{
		id: 2690,
		cd: "STPP",
		lb: "Barclays PLC - iPath US Treasury Steepener ETN"
	},
	{ id: 713, cd: "CTBI", lb: "Community Trust Bancorp, Inc. - Common Stock" },
	{ id: 932, cd: "EMITF", lb: "Elbit Imaging Ltd. - Ordinary Shares" },
	{
		id: 4258,
		cd: "DFP",
		lb:
			"Flaherty & Crumrine Dynamic Preferred and Income Fund Inc. Common Stock"
	},
	{
		id: 3357,
		cd: "AMT$B",
		lb:
			"American Tower Corporation (REIT) Depositary Shares, each representing a 1/10th ownership interest in a share of 5.50% Mandatory Convertible Preferred Stock, Series B"
	},
	{ id: 4392, cd: "DV", lb: "DeVry Education Group Inc. Common Stock" },
	{
		id: 3488,
		cd: "AXL",
		lb: "American Axle & Manufacturing Holdings, Inc. Common Stock"
	},
	{
		id: 3968,
		cd: "CLYH",
		lb: "iShares Interest Rate Hedged 10  Year Credit Bond ETF"
	},
	{ id: 4129, cd: "CUPM", lb: "iPath Pure Beta Copper ETN" },
	{ id: 5714, cd: "IWC", lb: "iShares Microcap ETF" },
	{ id: 3382, cd: "AON", lb: "Aon plc Class A Ordinary Shares (UK)" },
	{ id: 4952, cd: "FSTA", lb: "Fidelity MSCI COnsumer Staples Index ETF" },
	{ id: 223, cd: "ARWAR", lb: "Arowana Inc. - Rights" },
	{ id: 3419, cd: "ARL", lb: "American Realty Investors, Inc. Common Stock" },
	{ id: 4063, cd: "CRBN", lb: "iShares MSCI ACWI Low Carbon Target ETF" },
	{
		id: 2070,
		cd: "OIIM",
		lb:
			"O2Micro International Limited - Ordinary Shares each 50 shares of which are represented by an American Depositary Share"
	},
	{
		id: 4366,
		cd: "DSL",
		lb:
			"DoubleLine Income Solutions Fund Common Shares of Beneficial Interests"
	},
	{
		id: 2078,
		cd: "OMAB",
		lb:
			"Grupo Aeroportuario del Centro Norte S.A.B. de C.V. - American Depositary Shares each representing 8 Series B shares"
	},
	{
		id: 1335,
		cd: "HCAPL",
		lb: "Harvest Capital Credit Corporation - 7.00% Notes due 2020"
	},
	{ id: 1992, cd: "NTAP", lb: "NetApp, Inc. - Common Stock" },
	{ id: 799, cd: "DGRW", lb: "WisdomTree U.S. Quality Dividend Growth Fund" },
	{ id: 3419, cd: "ARL", lb: "American Realty Investors, Inc. Common Stock" },
	{
		id: 2915,
		cd: "UVSP",
		lb: "Univest Corporation of Pennsylvania - Common Stock"
	},
	{ id: 1933, cd: "NBIX", lb: "Neurocrine Biosciences, Inc. - Common Stock" },
	{ id: 1934, cd: "NBN", lb: "Northeast Bancorp - Common Stock" },
	{
		id: 3805,
		cd: "CACI",
		lb: "CACI International, Inc. Class A Common Stock"
	},
	{
		id: 4925,
		cd: "FPT",
		lb:
			"Federated Premier Intermediate Municipal Income Fund Federated Premier Intermediate Municipal Income Fund"
	},
	{ id: 1932, cd: "NAVI", lb: "Navient Corporation - Common Stock" },
	{ id: 2516, cd: "SELB", lb: "Selecta Biosciences, Inc. - Common Stock" },
	{
		id: 1320,
		cd: "HBAN",
		lb: "Huntington Bancshares Incorporated - Common Stock"
	},
	{ id: 199, cd: "ARCB", lb: "ArcBest Corporation - Common Stock" },
	{ id: 3561, cd: "BCO", lb: "Brinks Company (The) Common Stock" },
	{
		id: 2072,
		cd: "OILU",
		lb: "AccuShares S&P GSCI Crude Oil Excess Return Up Shares"
	},
	{ id: 73, cd: "AEHR", lb: "Aehr Test Systems - Common Stock" },
	{
		id: 3278,
		cd: "AHT$F",
		lb:
			"Ashford Hospitality Trust Inc 7.375% Series F Cumulative Preferred Stock"
	},
	{ id: 2109, cd: "ORLY", lb: "O'Reilly Automotive, Inc. - Common Stock" },
	{ id: 3699, cd: "BPT", lb: "BP Prudhoe Bay Royalty Trust Common Stock" },
	{ id: 3996, cd: "CNDA", lb: "IQ Canada Small Cap ETF" },
	{ id: 3966, cd: "CLX", lb: "Clorox Company (The) Common Stock" },
	{ id: 317, cd: "BELFB", lb: "Bel Fuse Inc. - Class B Common Stock" },
	{ id: 3620, cd: "BHP", lb: "BHP Billiton Limited Common Stock" },
	{ id: 3859, cd: "CCS", lb: "Century Communities, Inc. Common Stock" },
	{ id: 1300, cd: "GTIM", lb: "Good Times Restaurants Inc. - Common Stock" },
	{
		id: 5573,
		cd: "IIM",
		lb: "Invesco Value Municipal Income Trust Common Stock"
	},
	{ id: 1202, cd: "GALTW", lb: "Galectin Therapeutics Inc. - Warrants" },
	{ id: 1993, cd: "NTCT", lb: "NetScout Systems, Inc. - Common Stock" },
	{ id: 3375, cd: "ANTX", lb: "Anthem, Inc. Corporate Units" },
	{ id: 5594, cd: "IMS", lb: "IMS Health Holdings, Inc. Common Stock" },
	{
		id: 5671,
		cd: "ISF",
		lb: "ING Group, N.V. Perp Hybrid Cap Secs (Netherlands)"
	},
	{
		id: 2082,
		cd: "OMEX",
		lb: "Odyssey Marine Exploration, Inc. - Common Stock"
	},
	{ id: 2215, cd: "PI", lb: "Impinj, Inc. - Common Stock" },
	{ id: 5416, cd: "HST", lb: "Host Hotels & Resorts, Inc. Common Stock" },
	{ id: 3808, cd: "CAFE", lb: "iPath Pure Beta Coffee ETN" },
	{
		id: 3831,
		cd: "CBL",
		lb: "CBL & Associates Properties, Inc. Common Stock"
	},
	{
		id: 2223,
		cd: "PLAY",
		lb: "Dave & Buster's Entertainment, Inc. - Common Stock"
	},
	{
		id: 342,
		cd: "BKEPP",
		lb: "Blueknight Energy Partners L.P., L.L.C. - Series A Preferred Units"
	},
	{ id: 580, cd: "CIVB", lb: "Civista Bancshares, Inc.  - Common Stock" },
	{
		id: 602,
		cd: "CLNT",
		lb: "Cleantech Solutions International, Inc. - Common Stock"
	},
	{ id: 393, cd: "BREW", lb: "Craft Brew Alliance, Inc. - Common Stock" },
	{ id: 5277, cd: "HCA", lb: "HCA Holdings, Inc. Common Stock" },
	{
		id: 5577,
		cd: "IJNK",
		lb: "SPDR Barclays International High Yield Bond ETF"
	},
	{ id: 1607, cd: "KHC", lb: "The Kraft Heinz Company - Common Stock" },
	{
		id: 4637,
		cd: "EQWL",
		lb: "PowerShares Russell Top 200 Equal Weight Portfolio"
	},
	{ id: 5711, cd: "IVW", lb: "iShares S&P 500 Growth ETF" },
	{ id: 556, cd: "CHMA", lb: "Chiasma, Inc. - Common Stock" },
	{
		id: 2319,
		cd: "PZZA",
		lb: "Papa John's International, Inc. - Common Stock"
	},
	{ id: 1028, cd: "FCAN", lb: "First Trust Canada AlphaDEX Fund" },
	{ id: 212, cd: "ARLZ", lb: "Aralez Pharmaceuticals Inc. - Common Shares" },
	{ id: 1112, cd: "FNJN", lb: "Finjan Holdings, Inc. - Common Stock" },
	{
		id: 5118,
		cd: "GLP",
		lb:
			"Global Partners LP Global Partners LP Common Units representing Limited Partner Interests"
	},
	{ id: 5617, cd: "INST", lb: "Instructure, Inc. Common Stock" },
	{ id: 3991, cd: "CMU", lb: "MFS Municipal Income Trust Common Stock" },
	{ id: 1010, cd: "FAD", lb: "First Trust Multi Cap Growth AlphaDEX Fund" },
	{ id: 164, cd: "AMWD", lb: "American Woodmark Corporation - Common Stock" },
	{
		id: 1715,
		cd: "LONE",
		lb: "Lonestar Resources US Inc. - Class A Common Stock"
	},
	{ id: 5647, cd: "IPOS", lb: "Renaissance Capital Greenwich Fund" },
	{ id: 2385, cd: "RELL", lb: "Richardson Electronics, Ltd. - Common Stock" },
	{ id: 1375, cd: "HOFT", lb: "Hooker Furniture Corporation - Common Stock" },
	{
		id: 4088,
		cd: "CSH",
		lb: "Cash America International, Inc. Common Stock"
	},
	{ id: 2602, cd: "SNAK", lb: "Inventure Foods, Inc. - Common Stock" },
	{
		id: 1404,
		cd: "HTGM",
		lb: "HTG Molecular Diagnostics, Inc. - Common Stock"
	},
	{ id: 1202, cd: "GALTW", lb: "Galectin Therapeutics Inc. - Warrants" },
	{
		id: 679,
		cd: "CREG",
		lb: "China Recycling Energy Corporation - Common Stock"
	},
	{ id: 5174, cd: "GRF", lb: "Eagle Capital Growth Fund, Inc. Common Stock" },
	{
		id: 4088,
		cd: "CSH",
		lb: "Cash America International, Inc. Common Stock"
	},
	{ id: 4809, cd: "FDC", lb: "First Data Corporation Class A Common Stock" },
	{ id: 5493, cd: "IBMF", lb: "iShares iBonds Sep 2017 Term Muni Bond ETF" },
	{ id: 2410, cd: "RLJE", lb: "RLJ Entertainment, Inc. - Common Stock" },
	{ id: 2365, cd: "RBCN", lb: "Rubicon Technology, Inc. - Common Stock" },
	{ id: 4396, cd: "DVHI", lb: "ETRACS Diversified High Income ETN" },
	{
		id: 4371,
		cd: "DSUM",
		lb: "PowerShares Chinese Yuan Dim Sum Bond Portfolio"
	},
	{ id: 355, cd: "BLRX", lb: "BioLineRx Ltd. - American Depositary Shares" },
	{ id: 2173, cd: "PCOM", lb: "Points International, Ltd. - Common Shares" },
	{
		id: 257,
		cd: "ATSG",
		lb: "Air Transport Services Group, Inc - Common Stock"
	},
	{
		id: 1175,
		cd: "FTRPR",
		lb:
			"Frontier Communications Corporation - 11.125% Series A Mandatory Convertible Preferred Stock"
	},
	{ id: 3806, cd: "CAE", lb: "CAE Inc. Ordinary Shares" },
	{ id: 3152, cd: "AADR", lb: "WCM BNY Mellon Focused Growth ADR ETF" },
	{ id: 3193, cd: "ADM", lb: "Archer-Daniels-Midland Company Common Stock" },
	{ id: 2314, cd: "PXS", lb: "Pyxis Tankers Inc. - Common Stock" },
	{ id: 1846, cd: "MKTX", lb: "MarketAxess Holdings, Inc. - Common Stock" },
	{
		id: 441,
		cd: "CAPX",
		lb: "Elkhorn S&P 500 Capital Expenditures Portfolio"
	},
	{
		id: 3517,
		cd: "BAC$L",
		lb:
			"Bank of America Corporation Non Cumulative Perpetual Conv Pfd Ser L"
	},
	{ id: 595, cd: "CLDX", lb: "Celldex Therapeutics, Inc. - Common Stock" },
	{
		id: 330,
		cd: "BIDU",
		lb:
			"Baidu, Inc. - American Depositary Shares, each representing one tenth Class A ordinary share"
	},
	{ id: 963, cd: "ESEA", lb: "Euroseas Ltd. - Common Stock" },
	{ id: 626, cd: "CNFR", lb: "Conifer Holdings, Inc. - Common Stock" },
	{ id: 5125, cd: "GLW", lb: "Corning Incorporated Common Stock" },
	{ id: 4579, cd: "ENFR", lb: "Alerian Energy Infrastructure ETF" },
	{ id: 2253, cd: "PPH", lb: "VanEck Vectors Pharmaceutical ETF" },
	{ id: 1973, cd: "NILE", lb: "Blue Nile, Inc. - Common Stock" },
	{
		id: 5454,
		cd: "HYI",
		lb:
			"Western Asset High Yield Defined Opportunity Fund Inc. Common Stock"
	},
	{ id: 1161, cd: "FSZ", lb: "First Trust Switzerland AlphaDEX Fund" },
	{ id: 2206, cd: "PFPT", lb: "Proofpoint, Inc. - Common Stock" },
	{ id: 2446, cd: "RTK", lb: "Rentech, Inc. - Common Stock" },
	{ id: 5606, cd: "ING", lb: "ING Group, N.V. Common Stock" },
	{ id: 1865, cd: "MOBL", lb: "MobileIron, Inc. - Common Stock" },
	{
		id: 89,
		cd: "AGIIL",
		lb:
			"Argo Group International Holdings, Ltd. - 6.5% Senior Notes Due 2042"
	},
	{ id: 2188, cd: "PEGA", lb: "Pegasystems Inc. - Common Stock" },
	{ id: 3125, cd: "ZGNX", lb: "Zogenix, Inc. - Common Stock" },
	{ id: 5326, cd: "HEWW", lb: "iShares Currency Hedged MSCI Mexico ETF" },
	{ id: 3190, cd: "ADGE", lb: "American DG Energy Inc. Common Stock" },
	{ id: 4543, cd: "EMBB", lb: "SPDR MSCI EM Beyond BRIC ETF" },
	{ id: 2332, cd: "QLC", lb: "FlexShares US Quality Large Cap Index Fund" },
	{ id: 2348, cd: "QSII", lb: "Quality Systems, Inc. - Common Stock" },
	{ id: 3911, cd: "CHIQ", lb: "Global X China Consumer ETF" },
	{
		id: 3347,
		cd: "AMID",
		lb:
			"American Midstream Partners, LP Common Units representing Limited Partner Interests"
	},
	{
		id: 3106,
		cd: "YIN",
		lb: "Yintech Investment Holdings Limited - American Depositary Shares"
	},
	{ id: 3019, cd: "WEBK", lb: "Wellesley Bancorp, Inc. - Common Stock" },
	{ id: 1625, cd: "KOSS", lb: "Koss Corporation - Common Stock" },
	{
		id: 4226,
		cd: "DDLS",
		lb:
			"WisdomTree Dynamic Currency Hedged International SmallCap Equity Fund"
	},
	{ id: 3686, cd: "BOIL", lb: "ProShares Ultra Bloomberg Natural Gas" },
	{
		id: 4402,
		cd: "DVYE",
		lb: "iShares Emerging Markets Dividend Index Fund Exchange Traded Fund"
	},
	{ id: 1104, cd: "FMI", lb: "Foundation Medicine, Inc. - Common Stock" },
	{ id: 1011, cd: "FALC", lb: "FalconStor Software, Inc. - Common Stock" },
	{
		id: 1569,
		cd: "JGBB",
		lb: "WisdomTree Japan Interest Rate Strategy Fund"
	},
	{ id: 3819, cd: "CAS", lb: "Castle (A.M.) & Co. Common Stock" },
	{ id: 475, cd: "CBSH", lb: "Commerce Bancshares, Inc. - Common Stock" },
	{ id: 851, cd: "DWAT", lb: "Arrow DWA Tactical ETF" },
	{
		id: 1340,
		cd: "HCSG",
		lb: "Healthcare Services Group, Inc. - Common Stock"
	},
	{ id: 3793, cd: "C", lb: "Citigroup, Inc. Common Stock" },
	{ id: 2971, cd: "VRML", lb: "Vermillion, Inc. - Common Stock" },
	{ id: 2063, cd: "OFIX", lb: "Orthofix International N.V. - Common Stock" },
	{
		id: 2730,
		cd: "TANNI",
		lb: "TravelCenters of America LLC - 8.25% Senior Notes due 2028"
	},
	{ id: 1258, cd: "GNTX", lb: "Gentex Corporation - Common Stock" },
	{
		id: 5119,
		cd: "GLQ",
		lb:
			"Clough Global Equity Fund Clough Global Equity Fund Common Shares of Beneficial Interest"
	},
	{
		id: 3750,
		cd: "BTA",
		lb:
			"BlackRock Long-Term Municipal Advantage Trust BlackRock Long-Term Municipal Advantage Trust Common Shares of Beneficial Interest"
	},
	{
		id: 4215,
		cd: "DCUC",
		lb: "Dominion Resources, Inc. VA New 2014 Series A Corp Unit"
	},
	{ id: 3476, cd: "AVX", lb: "AVX Corporation Common Stock" },
	{ id: 5126, cd: "GM", lb: "General Motors Company Common Stock" },
	{ id: 1438, cd: "ICLDW", lb: "InterCloud Systems, Inc - Warrant" },
	{
		id: 5290,
		cd: "HDEE",
		lb:
			"Deutsche X-trackers MSCI Emerging Markets High Dividend Yield Hedged Equity ETF"
	},
	{ id: 2333, cd: "QLGC", lb: "QLogic Corporation - Common Stock" },
	{ id: 5634, cd: "IPAY", lb: "PureFunds ISE Mobile Payments ETF" },
	{ id: 180, cd: "ANY", lb: "Sphere 3D Corp. - Common Shares" },
	{ id: 2823, cd: "TSBK", lb: "Timberland Bancorp, Inc. - Common Stock" },
	{ id: 2007, cd: "NUROW", lb: "NeuroMetrix, Inc. - Warrants" },
	{ id: 73, cd: "AEHR", lb: "Aehr Test Systems - Common Stock" },
	{
		id: 3831,
		cd: "CBL",
		lb: "CBL & Associates Properties, Inc. Common Stock"
	},
	{
		id: 4514,
		cd: "EHT",
		lb:
			"Eaton Vance High Income 2021 Target Term Trust Common Shares of Beneficial Interest"
	},
	{
		id: 4796,
		cd: "FCE.B",
		lb: "Forest City Realty Trust, Inc. Common Stock"
	},
	{
		id: 1997,
		cd: "NTIC",
		lb: "Northern Technologies International Corporation - Common Stock"
	},
	{ id: 4452, cd: "ECL", lb: "Ecolab Inc. Common Stock" },
	{ id: 4276, cd: "DHI", lb: "D.R. Horton, Inc. Common Stock" },
	{ id: 3940, cd: "CIT", lb: "CIT Group Inc (DEL) Common Stock" },
	{ id: 2396, cd: "RFEU", lb: "First Trust RiverFront Dynamic Europe ETF" }
].reduce((acc, thirdparty) => {
	acc[thirdparty.id] = thirdparty;
	return acc;
}, {});
export class MyThirdparties extends Component {
	constructor(props) {
		super(props);
		const functionsObject = {
			...functions,
			thirdparties: {} //thirdpartiesFunctions
		};
		this.state = { functions: functionsTable(functionsObject), status: {} };
	}
	// componentWillReceiveProps(nextProps) {
	// 	console.log(nextProps);
	// }
	// componentWillUnMount() {
	// 	console.log("unmount");
	// }
	// componentDidUnMount() {
	// 	console.log("unmount1");
	// }
	// componentDidUnmount() {
	// 	console.log("unmount2");
	// }
	// componentWillUnmount() {
	// 	console.log("unmount3");
	// }

	render() {
		return React.cloneElement(
			<ZebulonTable
				key="thirdparties"
				id="thirdparties"
				meta={metaThirdparties}
				// filters={filters}
				// status={this.state.status}
				// sizes={{ height: 300, width: 500 }}
				functions={this.state.functions}
			/>,
			{ ...this.props }
		);
	}
}
