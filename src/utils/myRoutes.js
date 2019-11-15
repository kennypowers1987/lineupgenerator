import draftkings from "../components/DraftKingsGenerator.vue";
import fanduel  from "../components/FanDuelGenerator.vue";
import captainmode  from "../components/CaptainModeGenerator.vue";
import tiers from "../components/TiersGeneratorDK.vue";
import exposure from "../components/ExposureMachine.vue";
import dknba from "../components/DraftKingsGeneratorNba.vue";
import fantasydraftnfl from "../components/FantasyDraftGenerator.vue";
import fantasydraftnba from "../components/FantasyDraftNBA.vue";
import yahoo from "../components/YahooGenerator.vue";


const DraftKings = {
	//template: '#modals',
	routes,
	render: h => h(draftkings)
};
const Yahoo = {
	//template: '#modals',
	routes,
	render: h => h(yahoo)
};

const FanDuel = {
	//template: '#modals',
	routes,
	render: h => h(fanduel)
};

const CaptainMode = {
	//template: '#modals',
	routes,
	render: h => h(captainmode)
};
const Tiers = {
	//template: '#modals',
	routes,
	render: h => h(tiers)
};
const ExposureMachine = {
	//template: '#modals',
	routes,
	render: h => h(exposure)
};

const DraftKingsNba = {
	//template: '#modals',
	routes,
	render: h => h(dknba)
};

const FantasyDraftNfl = {
	//template: '#modals',
	routes,
	render: h => h(fantasydraftnfl)
};
const FantasyDraftNba = {
	//template: '#modals',
	routes,
	render: h => h(fantasydraftnba)
};
const routes = [	
    {
		path: "/DraftKings",
		component: DraftKings
	},
	{
		path: "/FanDuel",
		component: FanDuel
    },
    {
		path: "/CaptainMode",
		component: CaptainMode
    },
    {
		path: "/Tiers",
		component: Tiers
	},
	{
		path: "/ExposureMachine",
		component: ExposureMachine
	},
	{
		path: "/DraftKingsNba",
		component: DraftKingsNba
	},
	{
		path: "/FantasyDraftNfl",
		component: FantasyDraftNfl
	},
	{
		path: "/FantasyDraftNba",
		component: FantasyDraftNba
	},
	{
		path: "/Yahoo",
		component: Yahoo
	},
	{
		path: "*",
		redirect: "/"
	}
];

export default routes;
