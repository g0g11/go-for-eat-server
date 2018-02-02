module.exports = {
	facebook: {
		clientId: process.env.FACEBOOK_CLIENTID,
		clientSecret: process.env.FACEBOOK_CLIENTSECRET,
		validateUrl: 'https://graph.facebook.com/me',
		fields: '?fields=id,first_name,email,picture.width(500).height(500),birthday,gender'
	},
	google: {
		consumerKey: process.env.GOOGLE_CONSUMERKEY,
		consumerSecret: process.env.GOOGLE_CONSUMERSECRET,
		validateUrl: 'https://www.googleapis.com/oauth2/v3/tokeninfo?id_token='
	}
}