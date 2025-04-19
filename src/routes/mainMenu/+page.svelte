<script>
	import { goto } from "$app/navigation";
	import { auth, roomsCollectionRef, setRoomRef, userCollectionRef } from "$lib/db";
	import { confirmPasswordReset, deleteUser, onAuthStateChanged, reauthenticateWithCredential, sendPasswordResetEmail } from "@firebase/auth";
	import { deleteDoc, doc, getDoc, setDoc } from "@firebase/firestore";
    import defaultCharImg from '$lib/assets/userDefaultImg.png';
	import { EmailAuthProvider } from "@firebase/auth";
    let dialogState = $state(-1)
    let characters = $state([])
    let roomsCreated = $state([])
    let roomsEntered = $state([])
    let username = $state("")
    let addCharName = $state("")
    let charImgUrl = $state("")
    let roomName = $state("")
    let roomPassword = $state("")
    let roomError = $state("")
    let userDoc = $state(null)
    let editCharName = $state("")
    let editCharImgUrl = $state("")
    let editCharIdx = $state()
    let editUserName = $state("")
    let dateOfSignup = $state("")
    let resetPasswordEmailSent = $state("")
    let reauthenticateEmail = $state("")
    let reauthenticatePassword = $state("")
    let reauthenticateError = $state("")

    onAuthStateChanged(auth, async (user) => {
        if(user){
            let userDocRef = doc(userCollectionRef, auth.currentUser.uid)
            userDoc = await getDoc(userDocRef)
            userDoc = userDoc.data()
            username = userDoc.nome
            editUserName = username
            dateOfSignup = auth.currentUser.metadata.creationTime
            let arr = userDoc.personagens
            for(let i = 0; i < arr.length; i++){
                characters.push(arr[i])
            }

            arr = userDoc.roomsCreated
            for(let i = 0; i < arr.length; i++){
                roomsCreated.push(arr[i])
            }

            arr = userDoc.roomsEntered
            for(let i = 0; i < arr.length; i++){
                roomsEntered.push(arr[i])
            }
        }
    })

    async function logout(){
        await auth.signOut()
        goto('/Projeto-RPGTools/')
    }

    function addChar(){
        if(addCharName == ""){
            return
        }
        characters.push({
            nome: addCharName,
            img: charImgUrl
        })
        addCharName = ""
        charImgUrl = ""
        saveData()
    }

    function removeChar(i){
        characters.splice(i, 1)
        saveData()
    }

    function editChar(){
        if(editCharName == ""){
            return
        }
        characters[editCharIdx].nome = editCharName
        characters[editCharIdx].img = editCharImgUrl
        saveData()
        dialogState = -1
    }

    async function saveData(){
        if(userDoc == null){
            goto('/Projeto-RPGTools/')
        }
        let userDocRef = await doc(userCollectionRef, auth.currentUser.uid)
        await setDoc(userDocRef, {
            nome: username,
            personagens: characters,
            uid: auth.currentUser.uid,
            roomsCreated: roomsCreated,
            roomsEntered: roomsEntered
        })
    }

    async function createRoom(){
        if(userDoc == null){
            goto('/Projeto-RPGTools/')
        }
        if(roomName == "" || roomPassword == ""){
            roomError = "Preencha todos os campos."
            return
        }

        let roomDoc = await getDoc(doc(roomsCollectionRef, roomName))
        if(roomDoc.exists()){
            roomError = `A sala ${roomName} já existe.`
            return
        }

        await setDoc(doc(roomsCollectionRef, roomName), {
            nome: roomName,
            senha: roomPassword,
            jogadores: [userDoc],
            personagens: [],
            owner: auth.currentUser.uid
        }).catch((error) => {
            roomError = error
        })

        roomsCreated.push(roomName)
        await saveData()
        setRoomRef(roomName)
        goto('/Projeto-RPGTools/room')
    }

    async function enterRoom(){
        if(userDoc == null){
            goto('/Projeto-RPGTools/')
        }
        if(roomName == "" || roomPassword == ""){
            roomError = "Preencha todos os campos."
            return
        }
        let roomDocRef = await getDoc(doc(roomsCollectionRef, roomName))
        let roomData = roomDocRef.data()
        if(!roomDocRef.exists()){
            roomError = `A sala ${roomName} não existe.`
            return
        } else if(roomPassword != roomData.senha){
            roomError = "Senha incorreta."
            return
        }

        if(!roomsCreated.includes(roomName.toString()) && !roomsEntered.includes(roomName.toString())){
            roomsEntered.push(roomName.toString())
        }
        await saveData()
        setRoomRef(roomName.toString())
        goto("/Projeto-RPGTools/room")
    }

    async function deleteRoom(i){
        if(userDoc == null){
            goto('/Projeto-RPGTools/')
        }
        let roomDoc = await getDoc(doc(roomsCollectionRef, roomsCreated[i]))
        let players = roomDoc.data()
        players = players.jogadores
        for(let player of players){
            if(player.uid == auth.currentUser.uid){
                continue
            }
            let roomsEnteredUpdated = player.roomsEntered
            roomsEnteredUpdated.splice(roomsEnteredUpdated.indexOf(roomsCreated[i]), 1)
            await setDoc(doc(userCollectionRef, player.uid), {
                nome: player.nome,
                personagens: player.personagens,
                roomsCreated: player.roomsCreated,
                roomsEntered: roomsEnteredUpdated,
                uid: player.uid
            })
        }
        await deleteDoc(doc(roomsCollectionRef, roomsCreated[i]))
        roomsCreated.splice(i, 1)
        saveData()
    }

    async function quitFromRoom(idx){
        if(userDoc == null){
            goto('/Projeto-RPGTools/')
        }
        let roomDoc = await getDoc(doc(roomsCollectionRef, roomsEntered[idx]))
        let roomData = roomDoc.data()
        let players = roomData.jogadores
        let roomChars = []
        for(let i = 0; i < players.length; i++){
            if(players[i].uid != auth.currentUser.uid){
                continue
            }
            let chars = players[i].personagens
            roomChars = roomData.personagens
            for(let j = 0; j < chars.length; j++){
                for(let z = 0; z < roomChars.length; z++){
                    if(chars[j].nome == roomChars[z].nome){
                        roomChars.splice(z, 1)
                    }
                }
            }
            players.splice(i, 1)
        }
        await setDoc(doc(roomsCollectionRef, roomsEntered[idx]), {
            jogadores: players,
            nome: roomData.nome,
            owner: roomData.owner,
            personagens: roomChars,
            senha: roomData.senha
        })
        roomsEntered.splice(idx, 1)
        saveData()
    }

    function accessRoom(room){
        if(userDoc == null){
            goto('/Projeto-RPGTools/')
        }
        setRoomRef(room)
        goto('/Projeto-RPGTools/room')
    }

    function redefinirSenha(){
        sendPasswordResetEmail(auth, auth.currentUser.email).then(() => resetPasswordEmailSent = "Email de redefinição de senha enviado.")
    }

    async function deletarConta(){
        for(let i = 0; i < roomsCreated.length; i++){
            await deleteRoom(i)
        }
        for(let i = 0; i < roomsEntered.length; i++){
            await quitFromRoom(i)
        }
        await deleteDoc(doc(userCollectionRef, auth.currentUser.uid))
        await deleteUser(auth.currentUser)
        goto('/Projeto-RPGTools/')
    }

    function reauthenticate(){
        let credential = EmailAuthProvider.credential(reauthenticateEmail, reauthenticatePassword)
        reauthenticateWithCredential(auth.currentUser, credential).then(() => deletarConta()).catch((error) => reauthenticateError = error)
    }
</script>

<dialog open={dialogState != -1} onclick={(ev) => {
    if(ev.srcElement.localName == "dialog"){
        dialogState = -1
        roomError = ""
        addCharName = ""
        roomName = ""
        roomPassword = ""
        resetPasswordEmailSent = ""
        reauthenticateError = ""
        reauthenticateEmail = ""
        reauthenticatePassword = ""
    }
}}>
    <div class="dialogBox">
        {#if dialogState == 0}
            <center>
                <h3>LISTA DE PERSONAGENS</h3>
                <div class="charList">
                    {#each characters as character, i}
                        <div class="charBox"><div class="imgDiv"><img src={(character.img)} onerror={(e) => e.srcElement.src = defaultCharImg} alt=""></div><p class="charText" style="top: -60%;">{(character.nome)}</p> <button class="editBtn" onclick={() => {
                            dialogState = 2
                            editCharImgUrl = character.img
                            editCharName = character.nome
                            editCharIdx = i
                        }}>EDITAR</button> <button class="removeBtn" onclick={() => removeChar(i)}>-</button></div>
                    {/each}
                </div>
                <h3>ADICIONAR PERSONAGEM</h3>
                <p style="color: black;">Nome:</p><input bind:value={addCharName}>
                <p style="color: black;">Imagem (URL):</p><input bind:value={charImgUrl}><br>
                <button style="margin-top: 4%;" id="addBtn" onclick={addChar}>+</button>
            </center>
        {:else if dialogState == 1}
            <center>
                <h3>CRIAR UMA SALA</h3>
                <p class="charText">Nome da sala:</p>
                <input bind:value={roomName}>
                <p class="charText">Senha da sala:</p>
                <input bind:value={roomPassword} type="password"><br>
                <p style="color: red;">{roomError}</p><br>
                <button id="createRoomBtn" onclick={createRoom}>CRIAR</button>
            </center>
        {:else if dialogState == 2}
            <center>
                <h3>EDITAR PERSONAGEM</h3>
                <p style="color: black;">Nome:</p><input bind:value={editCharName}>
                <p style="color: black;">Imagem (URL):</p><input bind:value={editCharImgUrl}><br>
                <button style="margin-top: 4%;" id="saveBtn" onclick={editChar}>SALVAR</button>
            </center>
        {:else if dialogState == 3}
            <center>
                <h3>MINHAS SALAS</h3>
                <div class="charList">
                    {#each roomsCreated as room, i}
                        <div class="charBox"><p class="charText">{room}</p> <button class="accessBtn" onclick={() => accessRoom(room)}>ACESSAR</button> <button class="removeBtn" style="left: 33%;" onclick={() => deleteRoom(i)}>-</button></div>
                    {/each}
                </div>
                <h3>SALAS ACESSADAS</h3>
                <div class="charList">
                    {#each roomsEntered as room}
                        <div class="charBox"><p class="charText">{room}</p> <button class="accessBtn" onclick={() => accessRoom(room)}>ACESSAR</button></div>
                    {/each}
                </div>
                <h3>ENTRAR EM UMA SALA</h3>
                <p class="charText">Nome da sala:</p>
                <input bind:value={roomName}>
                <p class="charText">Senha da sala:</p>
                <input bind:value={roomPassword} type="password"><br>
                <p style="color: red;">{roomError}</p><br>
                <button id="createRoomBtn" onclick={enterRoom}>ENTRAR</button>
            </center>
        {:else if dialogState == 4}
            <center><h3>MINHA CONTA</h3></center>
            <div style="margin-top: 15%;">
                <center>
                    <p class="charText">Nome de usuário:</p>
                    <input bind:value={editUserName}><br>
                    <button id="createRoomBtn" onclick={() => {
                        username = editUserName
                        saveData()
                    }}>SALVAR NOME DE USUÁRIO</button><br>
                    <p style="color: #0b8770; font-size: 20px;">{resetPasswordEmailSent}</p>
                    <p style="color: black;">{`ID de usuário: ${userDoc ? userDoc.uid : ""}`}</p>
                    <p style="color: black;">{`Data de criação da conta: ${dateOfSignup}`}</p>
                    <button style="background-color: #a6c288; margin-top: 5%;" onclick={redefinirSenha}>REDEFINIR SENHA</button>
                    <button style="background-color: red; margin-top: 10%;" onclick={() => dialogState = 5}>DELETAR CONTA</button>
                </center>
            </div>
        {:else}
            <center><h3 style="color: red; font-weight:300;">CONFIRME SEU LOGIN PARA DELETAR A CONTA</h3></center>
            <div style="margin-top: 15%;">
                <center>
                    <p class="charText">EMAIL:</p>
                    <input bind:value={reauthenticateEmail}>
                    <p class="charText">SENHA:</p>
                    <input bind:value={reauthenticatePassword} type="password"><br>
                    <p style="color: red;">{reauthenticateError}</p>
                    <button style="background-color: red; color: gold;" id="createRoomBtn" onclick={reauthenticate}>!!!   DELETAR   !!!</button>
                </center> 
            </div>
        {/if}
    </div>
</dialog>

<center><h1>RPG TOOLS</h1></center>
<div class="box">
    <center>
        <button onclick={() => dialogState = 1}>CRIAR UMA SALA</button><br>
        <button onclick={() => dialogState = 3}>ENTRAR EM UMA SALA</button><br>
        <button onclick={() => dialogState = 0}>ADICIONAR PERSONAGEM</button><br>
        <button onclick={() => dialogState = 4}>SUA CONTA</button><br>
        <button id="logoutBtn" onclick={logout}>FINALIZAR SESSÃO</button>
    </center>
</div>

<style>
* {
    font-family: Impact;
    color: rgb(214, 212, 212);
}
:global(body){
    background-color: #17181f;
    overflow: hidden;
}
.box {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 35%;
    height: 40%;
}
button {
    outline: 0;
    width: 35%;
    height: 4vh;
    border-radius: 5px;
    border: none;
    color: black;
    font-size: 100%;
    margin-bottom: 2.5%;
}
button:hover {
    scale: 1.03;
    background-color: #a6c288;
}
#logoutBtn:hover {
    background-color: #eb8d8d;
}
input {
    outline: 0;
    background-color: #17181f;
    border: none;
    border-radius: 8px;
    width: 60%;
    height: 3vh;
    padding-left: 2%;
}
@keyframes show {
    0% {
        left: 15%;
        top: 10%;
        scale: 0
    }
    20% {
        left: 15%;
        top: 10%;
        scale: 0.2
    }
    40% {
        left: 20%;
        top: 10%;
        scale: 0.4
    }
    60% {
        left: 25%;
        top: 10%;
        scale: 0.6
    }
    80% {
        left: 30%;
        top: 10%;
        scale: 0.8
    }
    100% {
        left: 35%;
        top: 10%;
        scale: 1
    }
}
dialog {
    background-color: rgba(1, 1, 1, 0.4);
    position: absolute;
    top: 0px;
    left: 0px;
    width: 100%;
    height: 100%;
    z-index: 1;
    border: none;
}
.dialogBox {
    position: relative;
    left: 35%;
    top: 10%;
    width: 25%;
    height: 70%;
    background-color: white;
    border-radius: 16px;
    box-shadow: 0 0 30px #314d4a;
    animation-name: show;
    animation-iteration-count: 1;
    animation-duration: 0.2s;
    animation-play-state: running;
    overflow: auto;
    scrollbar-width: none;
}
h3 {
    color: black;
}
.charList {
    overflow: auto;
    background-color: #17181f;
    width: 95%;
    height: 35vh;
    border-radius: 8px;
    padding-top: 2%;
    padding-bottom: 2%;
}
.charBox {
    background-color: white;
    width: 90%;
    height: 8vh;
    border-radius: 6px;
    box-shadow: 0 0 15px #314d4a;
    margin-bottom: 2%;
}
.charText {
    color: black;
    font-size: 16px;
    position: relative;
    top: 50%;
    left: -8%;
    transform: translate(0px, -50%);
    text-wrap: auto;
    max-width: 45%;
}
#addBtn {
    background-color: #0b8770;
    width: 2vw;
    height: 3.5vh;
    border-radius: 13px;
    margin-left: 2.5%;
}
#saveBtn {
    background-color: #0b8770;
    width: 2vw;
    height: 3.5vh;
    border-radius: 13px;
    margin-left: 2.5%;
    width: fit-content;
}
.removeBtn {
    position: relative;
    left: 35%;
    top: -125%;
    background-color: #eb8d8d;
    width: 2vw;
    height: 3.5vh;
    border-radius: 13px;
    font-size: 100%;
}
.editBtn {
    width: fit-content;
    height: 3.5vh;
    position: relative;
    top: -125%;
    left: 30%;
    border-radius: 13px;
    background-color: #ebe68d;
}
.accessBtn {
    position: relative;
    left: 30%;
    top: -20%;
    background-color: #0b8770;
    width: 4vw;
    height: 3.5vh;
    border-radius: 13px;
    font-size: 90%;
}
#createRoomBtn {
    margin-top: 2.5%;
    background-color: #0b8770;
}
img {
    object-fit: cover;
    object-position: center;
    width: 100%;
    height: 100%;
    border-radius: 120px;
}
.imgDiv {
    border-radius: 120px;
    border: 4px solid black;
    width: 14%;
    height: 80%;
    position: relative;
    left: -40%;
    top: 6%;
}
@media(max-height: 800px){
    @keyframes show {
        0% {
            left: 15%;
            top: 10%;
            scale: 0
        }
        20% {
            left: 15%;
            top: 10%;
            scale: 0.2
        }
        40% {
            left: 15%;
            top: 10%;
            scale: 0.4
        }
        60% {
            left: 15%;
            top: 10%;
            scale: 0.6
        }
        80% {
            left: 20%;
            top: 10%;
            scale: 0.8
        }
        100% {
            left: 25%;
            top: 10%;
            scale: 1
        }
    }
    .dialogBox {
        width: 45%;
        left: 25%;
    }
    .box {
        width: 45%;
        height: 50%;
    }
    button {
        width: 32%;
        height: 7vh;
    }
    input {
        height: 5vh;
        width: 60%;
    }
    #addBtn {
        width: 3vw;
        height: 5vh;
    }
    .charBox {
        height: 11.5vh;
        width: 96%;
    }
    .accessBtn {
        height: 5vh;
        width: 4.5vw;
        top: -10%;
        text-align: center;
    }
    .removeBtn {
        height: 5vh;
        width: 3vw;
        left: 32%;
    }
    .editBtn {
        left: 30%;
    }
    .imgDiv {
        width: 14%;
        margin-left: 5%;
    }
}
</style>