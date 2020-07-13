# ERI-js
Email Recipient Inspector is a project to help prevent email address typos. It requires a server component (https://github.com/Dynom/ERI).

# A Quick hello world:
Except that it'll not actually output hello world `¯\_(ツ)_/¯`

## Install ERI-js
```shell script
npm install eri-js
```

## Client code
```html
<script src="./node_modules/eri-js/eri-client.js" type="application/javascript"></script>
<script type="application/javascript">
    window.addEventListener("DOMContentLoaded", () => {
        const c = ERIClient.new({url: "http://localhost:1338"});
        c.suggest("john@example.org", (result) => {
            console.log(result);
        });
    });
</script>
```

## Start backend
This will work fine on a mac on on linux, on Windows you'll need to either download the [binary](https://github.com/Dynom/ERI/releases) or compile it yourself. 
```shell script
docker run --rm -it -p "1338:1338" dynom/eri:latest --backend-driver=memory
```

On a fresh start ERI is empty (which is always the case with the memory driver), since it operates only on domains previously learned. So you'll need to feed it some data. This is actually very easy. First try a legitimate domain and then make a typo and see what it comes up with. E.g.:

1. `john.doe@gmail.com` (_ERI validates the domain on the first request_)
1. `john.doe@gmail.con` (_Here it should suggest `john.doe@gmail.com`_)

