<script>
	import { goto } from '$app/navigation';
	import { auth, userCollectionRef } from '$lib/db';
	import { browserLocalPersistence, setPersistence, signInWithEmailAndPassword } from '@firebase/auth';
    let email = $state("")
    let senha = $state("")
    let erro = $state("")

    async function logar(){
        if(email == "" || senha == ""){
            erro = "Preencha todos os campos."
            return
        } else if(!email.includes("@gmail.com") && !email.includes("@hotmail.com") && !email.includes("@outlook.com")){
            erro = "Email inválido."
            return
        }

        await setPersistence(auth, browserLocalPersistence)
        const result = await signInWithEmailAndPassword(auth, email, senha).then(() => {
            goto('/Projeto-RPGTools/mainMenu')
        }).catch((error) => {
            erro = error
        })
    }
</script>

<center><h1>RPG TOOLS</h1></center>
<div class="box">
    <p>{erro}</p>
    <div class="centralBox">
        <input placeholder="Digite seu email" bind:value={email}><br>
        <input placeholder="Digite sua senha" type="password" bind:value={senha}><br>
        <button onclick={logar}>LOGAR</button><br>
        <button id="backBtn" onclick={() => goto('/Projeto-RPGTools/')}>VOLTAR</button>
    </div>
</div>

<style>
@font-face {
    font-family: 'imp';
    src: url('../lib/assets/impact.ttf');
}
* {
    font-family: 'imp';
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
    width: 32%;
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
.centralBox {
    position: relative;
    left: 35%;
    top: 10%;
}
input {
    outline: 0;
    margin-bottom: 2.5%;
    border-radius: 8px;
    border: none;
    width: 30%;
    height: 3vh;
    color: black;
    padding-left: 10px;
}
input:hover {
    scale: 1.03;
    background-color: #a6c288;
}
p {
    color: red;
    font-size: 18px;
    position: relative;
    left: 35%;
}
#backBtn {
    position: absolute;
    left: 16%;
    transform: translate(-50%, 0px);
}
@media(max-height: 800px){
    .box {
        width: 45%;
        height: 50%;
    }
    button {
        height: 7vh;
    }
    input {
        height: 5vh;
    }
}
</style>