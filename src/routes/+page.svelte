<script>
	import { goto } from '$app/navigation';
	import { auth } from '$lib/db';
	import { onAuthStateChanged } from '@firebase/auth';

    onAuthStateChanged(auth, (user) => {
        if(user){
            goto('/Projeto-RPGTools/mainMenu')
        }
    })
</script>

<center><h1>RPG TOOLS</h1></center>
<div class="box">
    <div class="centralBox">
        <button onclick={() => goto('/Projeto-RPGTools/login')}>LOGAR</button><br>
        <button onclick={() => goto('/Projeto-RPGTools/registrar')}>REGISTRAR</button>
    </div>
</div>

<style>
* {
    font-family: Impact;
    color: rgb(214, 212, 212);
}
:global(body){
    background-color: #17181f;
}
.box {
    position: absolute;
    background-color: #314d4a;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 35%;
    height: 40%;
    border-radius: 20px;
    box-shadow: 0px 0px 60px #263b39;
    padding-top: 2%;
}
button {
    outline: 0;
    width: 30%;
    height: 3.5vh;
    border-radius: 5px;
    border: none;
    color: black;
    font-size: 16px;
    margin-bottom: 2.5%;
}
button:hover {
    scale: 1.03;
    background-color: #a6c288;
}
.box:hover {
    scale: 1.05;
}
.centralBox {
    position: relative;
    left: 35%;
    top: 25%;
}
</style>