import React, { useState, useEffect } from "react";

export const AuthContext = React.createContext<IAuthContext>({});

export interface IAuthContext {
	clientPrinciple?: IClientPrinciple,
	publicUserInfo?: IPublicUserInfo
}

export interface IClientPrinciple {
	identityProvider: string,
	userId: string,
	userDetails: string,
	userRoles: string[],
};

export interface IPublicUserInfo {
	login: string
	id: number
	node_id: string
	avatar_url: string
	gravatar_id: string
	url: string
	html_url: string
	followers_url: string
	following_url: string
	gists_url: string
	starred_url: string
	subscriptions_url: string
	organizations_url: string
	repos_url: string
	events_url: string
	received_events_url: string
	type: string
	site_admin: boolean
	name: string
	company: string
	blog: string
	location: string
	email: string
	hireable: boolean
	bio: string
	twitter_username: string
	public_repos: number
	public_gists: number
	followers: number
	following: number
	created_at: string
	updated_at: string
}

export function useAzureAuth() {
	const [clientPrinciple, setClientPrinciple] = useState<IClientPrinciple>();
	useEffect(() => {
		fetch('/.auth/me').then(
			(rsp) => rsp.json()
		).then(
			(payload) => setClientPrinciple(payload.clientPrincipal)
		);
	}, [setClientPrinciple])

	const [publicUserInfo, setPublicUserInfo] = useState<IPublicUserInfo>();
	useEffect(() => {
		if (clientPrinciple?.identityProvider !== 'github') setPublicUserInfo(undefined);
		else fetch('https://api.github.com/users/' + clientPrinciple.userDetails).then(
			(rsp) => rsp.json()
		).then(
			(payload) => setPublicUserInfo(payload)
		);
	}, [clientPrinciple, setPublicUserInfo]);

	return { clientPrinciple, publicUserInfo };
}

