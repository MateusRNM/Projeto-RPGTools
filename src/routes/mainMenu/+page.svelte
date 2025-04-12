<script>
	import { goto } from "$app/navigation";
	import { auth, roomsCollectionRef, setRoomRef, userCollectionRef } from "$lib/db";
	import { onAuthStateChanged } from "@firebase/auth";
	import { deleteDoc, doc, getDoc, setDoc } from "@firebase/firestore";
    let dialogState = $state(-1)
    let characters = $state([])
    let roomsCreated = $state([])
    let roomsEntered = $state([])
    let username = $state("")
    let addCharName = $state("")
    let roomName = $state("")
    let roomPassword = $state("")
    let roomError = $state("")
    let userDoc = $state()

    onAuthStateChanged(auth, async (user) => {
        if(user){
            let userDocRef = doc(userCollectionRef, auth.currentUser.uid)
            userDoc = await getDoc(userDocRef)
            userDoc = userDoc.data()
            username = userDoc.nome
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
        characters.push(addCharName)
        addCharName = ""
        saveData()
    }

    function removeChar(i){
        characters.splice(i, 1)
        saveData()
    }

    async function saveData(){
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

    function accessRoom(room){
        setRoomRef(room)
        goto('/Projeto-RPGTools/room')
    }
</script>

<dialog open={dialogState != -1 ? true : false} onclick={(ev) => {
    if(ev.srcElement.localName == "dialog"){
        dialogState = -1
        roomError = ""
        addCharName = ""
        roomName = ""
        roomPassword = ""
    }
}}>
    <div class="dialogBox">
        {#if dialogState == 0}
            <center>
                <h3>LISTA DE PERSONAGENS</h3>
                <div class="charList">
                    {#each characters as character, i}
                        <div class="charBox"><p class="charText">{character}</p> <button class="removeBtn" onclick={() => removeChar(i)}>-</button></div>
                    {/each}
                </div>
                <h3>ADICIONAR PERSONAGEM</h3>
                <input bind:value={addCharName}> <button id="addBtn" onclick={addChar}>+</button>
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
        {:else}
            <center>
                <h3>MINHAS SALAS</h3>
                <div class="charList">
                    {#each roomsCreated as room, i}
                        <div class="charBox"><p class="charText">{room}</p> <button class="accessBtn" style="top: -78%; left: 30%;" onclick={() => accessRoom(room)}>ACESSAR</button> <button class="removeBtn" style="left: 33%;" onclick={() => deleteRoom(i)}>-</button></div>
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
        {/if}
    </div>
</dialog>

<center><h1>RPG TOOLS</h1></center>
<div class="box">
    <center>
        <button onclick={() => dialogState = 1}>CRIAR UMA SALA</button><br>
        <button onclick={() => dialogState = 2}>ENTRAR EM UMA SALA</button><br>
        <button onclick={() => dialogState = 0}>ADICIONAR PERSONAGEM</button><br>
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
    font-size: 16px;
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
        left: 35%;
        top: 40%;
        scale: 0
    }
    20% {
        left: 40%;
        top: 42%;
        scale: 0.2
    }
    40% {
        left: 45%;
        top: 44%;
        scale: 0.4
    }
    60% {
        left: 45%;
        top: 46%;
        scale: 0.6
    }
    80% {
        left: 50%;
        top: 48%;
        scale: 0.8
    }
    100% {
        left: 50%;
        top: 50%;
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
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
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
}
.charBox {
    background-color: white;
    width: 90%;
    height: 4.5vh;
    border-radius: 6px;
    box-shadow: 0 0 15px #314d4a;
}
.charText {
    color: black;
    font-size: 16px;
    position: relative;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
}
#addBtn {
    background-color: #0b8770;
    width: 2vw;
    height: 3.5vh;
    border-radius: 13px;
    margin-left: 2.5%;
}
.removeBtn {
    position: relative;
    left: 40%;
    top: -70%;
    background-color: #eb8d8d;
    width: 2vw;
    height: 3.5vh;
    border-radius: 13px;
    font-size: 24px;
}
.accessBtn {
    position: relative;
    left: 38%;
    top: -70%;
    background-color: #0b8770;
    width: 4vw;
    height: 3.5vh;
    border-radius: 13px;
    font-size: 16px;
}
#createRoomBtn {
    margin-top: 2.5%;
    background-color: #0b8770;
}
</style>