# kissci

Simple CI server for Github and Gitlab projects. It will auto pull on every push and build your project. It will update your commit using Github/Gitlab Status API, and add a link to itself to show the build logs.

## Build Sequence

![sequence-diagram](https://user-images.githubusercontent.com/5337921/51337109-9177d400-1a86-11e9-8e9e-cd0a379e131a.png)

## Github Instructions 

1. Have Node.js installed. 
2. `npm install`
3. Have a redis running at `localhost:6379`: `docker run -d -p 6379:6379 redis`
4. Get your personal token from <https://github.com/settings/tokens>
5. You need the CI process to be accessible from public internet so that Github can call it. For testing purposes you can have your local process tunnelled through the free [ngrok service](https://dashboard.ngrok.com/get-started). We assume this url is https://ci.example.com for the below commands.
6. Generate a random key, this will be your Build Secret to verify incoming webhook requests are originated from Github. Open your repository page <https://github.com/$user/$repo/settings/hooks/>, enter url `https://ci.example.com/webhook`, event_type is json, send only push events, and enter build secret there.
7. Then run `node kissci.js url_visible_from_outside bind_port build_secret github_token github_owner github_repo`
Example: 
`node kissci.js https://ci.example.com 4200 some_secret my_token bekce kissci`
It will run `build.sh` on your project root. 
8. If you want to keep your build script hidden from outsiders, you can specify its full path within your server as last argument:
``node kissci.js https://ci.example.com 4200 some_secret my_token bekce kissci `pwd`/my_custom_build.sh``

## Gitlab Instructions 

1. Have Node.js installed. 
2. `npm install`
3. Have a redis running at `localhost:6379`: `docker run -d -p 6379:6379 redis`
4. Get your personal token from <https://gitlab.com/profile/personal_access_tokens>, `api` scope is the only one we need.
5. You need the CI process to be accessible from public internet so that Github can call it. For testing purposes you can have your local process tunnelled through the free [ngrok service](https://dashboard.ngrok.com/get-started). We assume this url is https://ci.example.com for the below commands.
6. Generate a random key, this will be your Build Secret to verify incoming webhook requests are originated from Gitlab. Open your repository page <https://gitlab.com/$user/$repo/settings/integrations>, enter url `https://ci.example.com/webhook`, build_secret for Secret Token, send only push events.
7. Then run `node kissci-gitlab.js url_visible_from_outside bind_port build_secret gitlab_token gitlab_owner gitlab_repo`
Example: 
`node kissci-gitlab.js https://ci.example.com 4201 some_secret my_token bekce kissci`
It will run `build.sh` on your project root. 
8. If you want to keep your build script hidden from outsiders, you can specify its full path within your server as last argument:
``node kissci-gitlab.js https://ci.example.com 4201 some_secret my_token bekce kissci `pwd`/my_custom_build.sh``
9. This tool also supports private Gitlab installations (v8.1+), just change `GITLAB_BASE` const in the code.
