import draftkings from "../components/DraftKingsGenerator.vue";
import fanduel  from "../components/FanDuelGenerator.vue";
import captainmode  from "../components/CaptainModeGenerator.vue";
import tiers from "../components/TiersGeneratorDK.vue";
import exposure from "../components/ExposureMachine.vue";
import dknba from "../components/DraftKingsGeneratorNba.vue";

const DraftKings = {
	//template: '#modals',
	routes,
	render: h => h(draftkings)
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
		path: "*",
		redirect: "/"
	}
];

export default routes;
