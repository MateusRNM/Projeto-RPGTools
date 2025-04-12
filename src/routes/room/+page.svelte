<script>
	import { goto } from "$app/navigation";
	import { auth, roomRef, roomsCollectionRef, userCollectionRef } from "$lib/db";
	import { onAuthStateChanged } from "@firebase/auth";
	import { getDoc, doc, DocumentReference, setDoc, onSnapshot } from "@firebase/firestore";
	import { onMount } from "svelte";
    let roomDocRef = $state(null)
    let roomName = $state("")
    let roomOwner = $state("")
    let roomPassword = $state("")
    let characters = $state([])
    let charactersNames = $state([])
    let playerCharacters = $state([])
    let username = $state(null)
    let players = $state([])
    let dialogState = $state(-1)
    let addCharName = $state("")
    let roomsCreated = $state([])
    let roomsEntered = $state([])
    let userData = $state(undefined)

    roomRef.subscribe((value) => {
        roomDocRef = value
        if(roomDocRef != null){
            onSnapshot(roomDocRef, async (roomDoc) => {
                if(roomDoc.exists()){
                    if(username == null){
                        let userDocRef = doc(userCollectionRef, auth.currentUser.uid)
                        userData = await getDoc(userDocRef)
                        userData = userData.data()
                        username = userData.nome
                        playerCharacters = userData.personagens
                        roomsCreated = userData.roomsCreated
                        roomsEntered = userData.roomsEntered
                    }
                        
                    let roomData = roomDoc.data()
                    roomName = roomData.nome
                    roomOwner = roomData.owner
                    roomPassword = roomData.senha
                    characters = roomData.personagens
                    charactersNames = []
                    players = []
                    for(let char of characters){
                        charactersNames.push(char.nome)
                    }
                    players = roomData.jogadores
                    if(!(players.some(player => player.uid == auth.currentUser.uid))){
                        players.push(userData)
                        saveRoomData()
                    }
                }
            })
        }
    })

    onAuthStateChanged(auth, async (user) => {
        if(user){
            if(roomDocRef == null){
                goto('/Projeto-RPGTools/mainMenu')
            }
        }
    })

    function addCharacterInRoom(i){
        let charObject = {
            nome: playerCharacters[i],
            iniciativa: 0,
            critico: false,
            atributoDoTeste: 1
        }
        characters.push(charObject)
        charactersNames.push(playerCharacters[i])
        saveRoomData()
    }

    function removeCharacterInRoom(i){
        characters.splice(i, 1)
        charactersNames.splice(i, 1)
        saveRoomData()
    }

    async function saveRoomData(){
        await setDoc(doc(roomsCollectionRef, roomName), {
            nome: roomName,
            senha: roomPassword,
            jogadores: players,
            personagens: characters,
            owner: roomOwner
        })
    }

    async function saveUserData(){
        await setDoc(doc(userCollectionRef, auth.currentUser.uid), {
            nome: username,
            personagens: playerCharacters,
            uid: auth.currentUser.uid,
            roomsCreated: roomsCreated,
            roomsEntered: roomsEntered
        })
    }

    function addChar(){
        if(addCharName == ""){
            return
        }
        playerCharacters.push(addCharName)
        addCharName = ""
        saveUserData()
    }

    function removeChar(i){
        playerCharacters.splice(i, 1)
        saveUserData()
    }   
</script>

<dialog open={dialogState != -1 ? true : false} onclick={(ev) => {
    if(ev.srcElement.localName == "dialog"){
        dialogState = -1
        addCharName = ""
    }
}}>
<div class="dialogBox">
    {#if dialogState == 0}
        <center>
            <h3>ADICIONAR PERSONAGEM</h3>
            <div class="list">
                {#each playerCharacters as character, i}
                    {#if charactersNames.includes(character) == false}
                        <div class="charBox">
                            <p class="charText">{character}</p> <button class="addBtn" onclick={() => addCharacterInRoom(i)}>+</button> <button class="removeBtn" onclick={() => removeChar(i)}>-</button>
                        </div>
                    {/if}
                {/each}
            </div>
            <h3>ADICIONAR PERSONAGEM</h3>
            <input bind:value={addCharName}> <button id="addBtn" onclick={addChar}>+</button>
        </center>
    {/if}
</div>
</dialog>

<center><h1>RPG TOOLS</h1></center>

<div class="infosBox">
    <center>
        <h2>{roomName}</h2>
        <h3>JOGADORES</h3>
        <div class="list">
            {#each players as player}
                <p>{(player.nome)}</p>
            {/each}
        </div>
        <h3>PERSONAGENS</h3>
        <button style="background-color: #0b8770;" onclick={() => dialogState = 0}>ADICIONAR PERSONAGEM</button>
        <div class="list">
            {#each charactersNames as character, i}
                <div class="charBox">
                    <p class="charText">{character}</p> {#if playerCharacters.includes(character)}<button class="removeBtn" onclick={() => removeCharacterInRoom(i)}>-</button>{/if}
                </div>
            {/each}
        </div>
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
.infosBox {
    background-color: white;
    width: 20%;
    height: 80vh;
    border-radius: 16px;
    box-shadow: 0 0 30px #314d4a;
    overflow: auto;
    scrollbar-width: none;
}
h2 {
    color: black;
}
h3 {
    color: black;
}
.list {
    overflow: auto;
    background-color: #17181f;
    width: 95%;
    height: 35vh;
    border-radius: 8px;
}
p {
    color: white;
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
.addBtn {
    position: relative;
    left: 40%;
    top: -70%;
    background-color: #0b8770;
    width: 2vw;
    height: 3.5vh;
    border-radius: 13px;
    font-size: 24px;
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
#addBtn {
    background-color: #0b8770;
    width: 2vw;
    height: 3.5vh;
    border-radius: 13px;
    margin-left: 2.5%;
}
</style>