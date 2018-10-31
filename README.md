# kissci

Simple CI server for your Github projects. It will auto pull on every push and build your project. It will update your commit using Github Status API, and add a link to itself to show the build logs.

## Instructions

1. Have Node.js installed. 
2. `npm install`
3. Have a redis running at `localhost:6379`: `docker run -d -p 6379:6379 redis`
4. Get your personal token from <https://github.com/settings/tokens>
5. You can use <https://dashboard.ngrok.com/get-started> for reachable urls from outside world. Assuming it is https://ci.example.com
6. Open your repository page <https://github.com/user/repo/settings/hooks/>, add the url `https://ci.example.com/webhook`, event_type is json, send only push events.
7. Then run `node kissci.js url_visible_from_outside bind_port build_secret github_token github_owner github_owner`
Example: 
`node kissci.js https://ci.example.com 4200 some_secret my_token bekce kissci`
It will run `build.sh` on your project root. 
8. If you want to keep your build script hidden from outsiders, you can specify its full path within your server as last argument:
``node kissci.js https://ci.example.com 4200 some_secret my_token bekce kissci `pwd`/my_custom_build.sh``
