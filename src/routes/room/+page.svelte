<script>
	import { goto } from "$app/navigation";
	import { auth, roomRef, roomsCollectionRef, userCollectionRef } from "$lib/db";
	import { onAuthStateChanged } from "@firebase/auth";
	import { getDoc, doc, setDoc, onSnapshot } from "@firebase/firestore";
    import defaultCharImg from '$lib/assets/userDefaultImg.png';
    let roomDocRef = $state(null)
    let roomName = $state("")
    let roomOwner = $state("")
    let roomPassword = $state("")
    let characters = $state([])
    let playerCharacters = $state([])
    let username = $state(null)
    let players = $state([])
    let dialogState = $state(-1)
    let addCharName = $state("")
    let charImgUrl = $state("")
    let roomsCreated = $state([])
    let roomsEntered = $state([])
    let userData = $state(undefined)
    let editCharName = $state("")
    let editCharImgUrl = $state("")
    let editCharIdx = $state()

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
                    players = []
                    players = roomData.jogadores
                    if(!(players.some(player => player.uid == auth.currentUser.uid))){
                        players.push(userData)
                        saveRoomData()
                    }
                    organizarIniciativa()
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
            nome: playerCharacters[i].nome,
            img: playerCharacters[i].img,
            iniciativa: 0,
            critico: false,
            atributoDoTeste: 1
        }
        characters.push(charObject)
        saveRoomData()
    }

    function removeCharacterInRoom(i){
        characters.splice(i, 1)
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
        playerCharacters.push({
            nome: addCharName,
            img: charImgUrl
        })
        addCharName = ""
        charImgUrl = ""
        saveUserData()
    }

    function removeChar(i){
        playerCharacters.splice(i, 1)
        saveUserData()
    }   

    function editChar(){
        if(editCharName == ""){
            return
        }
        playerCharacters[editCharIdx].nome = editCharName
        playerCharacters[editCharIdx].img = editCharImgUrl
        saveUserData()
        dialogState = -1
    }

    function setIniciativa(value, i){
        characters[i].iniciativa = value
        saveRoomData()
    }

    function setCritico(value, i){
        characters[i].critico = value
        saveRoomData()
    }

    function setAtributoDoTeste(value, i){
        characters[i].atributoDoTeste = value
        saveRoomData()
    }

    function organizarIniciativa(){
        characters = characters.sort((a, b) => {
            if(b.iniciativa !== a.iniciativa){
                return b.iniciativa - a.iniciativa
            }

            if(b.critico !== a.critico){
                return b.critico ? 1 : -1
            }

            return b.atributoDoTeste - a.atributoDoTeste
        })
    }
</script>

<div class="box">
    <dialog open={dialogState != -1} onclick={(ev) => {
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
                        {#if !characters.some(char => char.nome == character.nome)}
                            <div class="charBox"><div class="imgDiv"><img src={(character.img)} onerror={(e) => e.srcElement.src = defaultCharImg} alt=""></div><p class="charText" style="top: -60%;">{(character.nome)}</p> <button class="editBtn" onclick={() => {
                                dialogState = 1
                                editCharImgUrl = character.img
                                editCharName = character.nome
                                editCharIdx = i
                            }}>EDITAR</button> <button class="addBtn" style="position: relative; top: -125%; left: 32%;" onclick={() => addCharacterInRoom(i)}>+</button> <button class="removeBtn" onclick={() => removeChar(i)}>-</button></div>
                        {/if}
                    {/each}
                </div>
                <h3>ADICIONAR PERSONAGEM</h3>
                <p style="color: black;">Nome:</p><input bind:value={addCharName}>
                <p style="color: black;">Imagem (URL):</p><input bind:value={charImgUrl}><br>
                <button style="margin-top: 4%;" class="addBtn" onclick={addChar}>+</button>
            </center>
        {:else}
            <center>
                <h3>EDITAR PERSONAGEM</h3>
                <p style="color: black;">Nome:</p><input bind:value={editCharName}>
                <p style="color: black;">Imagem (URL):</p><input bind:value={editCharImgUrl}><br>
                <button style="margin-top: 4%;" id="saveBtn" onclick={editChar}>SALVAR</button>
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
                {#each characters as character, i}
                    <div class="charBox">
                        <div class="imgDiv imgInfoBox"><img src={(character.img)} onerror={(e) => e.srcElement.src = defaultCharImg} alt=""></div><p class="charText" style="top: -60%;">{(character.nome)}</p> {#if playerCharacters.some(char => char.nome == character.nome)}<button class="removeBtn" style="top: -125%;" onclick={() => removeCharacterInRoom(i)}>-</button>{/if}
                    </div>
                {/each}
            </div>
        </center>
    </div>
    
    <div class="functionsBox">
        <center><h2>INICIATIVA</h2></center>
        <div class="list" id="initiativeList">
            <center>
                {#each characters as character, i}
                    <div class="charBox initiativeBox">
                        <div class="imgDiv imgDivInitiativeBox"><img src={(character.img)} onerror={(e) => e.srcElement.src = defaultCharImg} alt=""></div>
                        <p class="charText initiativeText">{(character.nome)}</p>
                        <p class="initiativeInputsText">VALOR:</p><input class="initiativeInputs" type="number" disabled={!playerCharacters.some(char => char.nome == character.nome)} value={(character.iniciativa)} onchange={(e) => {
                            setIniciativa(Number(e.srcElement.value), i)
                        }}>
                        <p class="initiativeInputsText">CRÍTICO:</p><input class="initiativeInputs" type="checkbox" disabled={!playerCharacters.some(char => char.nome == character.nome)} checked={(character.critico)} onchange={(e) => {
                            setCritico(e.srcElement.checked, i)
                        }}>
                        <p class="initiativeInputsText">ATRIBUTO DO TESTE:</p><input class="initiativeInputs" type="number" disabled={!playerCharacters.some(char => char.nome == character.nome)} value={(character.atributoDoTeste)} onchange={(e) => {
                            setAtributoDoTeste(Number(e.srcElement.value), i)
                        }}>
                    </div>
                {/each}
            </center>
        </div>
    </div>
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
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}
.infosBox {
    position: relative;
    left: 0.5%;
    background-color: white;
    width: 20%;
    height: 80vh;
    border-radius: 16px;
    box-shadow: 0 0 30px #314d4a;
    overflow: auto;
    scrollbar-width: none;
}
.functionsBox {
    position: relative;
    left: 25%;
    top: -80%;
    background-color: white;
    width: 50%;
    height: 80vh;
    border-radius: 16px;
    box-shadow: 0 0 30px #314d4a;
    overflow: auto;
    scrollbar-width: none;
    padding-left: 0.5%;
    padding-right: 0.5%;
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
    white-space: nowrap;
    padding-top: 2%;
    padding-bottom: 2%;
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
    font-size: 100%;
    margin-bottom: 2.5%;
}
button:hover {
    scale: 1.03;
    background-color: #a6c288;
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
.charBox {
    background-color: white;
    width: 98%;
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
.addBtn {
    background-color: #0b8770;
    width: 2vw;
    height: 3.5vh;
    border-radius: 13px;
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
    left: 32%;
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
    left: 32%;
    border-radius: 13px;
    background-color: #ebe68d;
}
#initiativeList {
    width: 100%;
    height: 90%;
    overflow: auto;
}
.initiativeBox {
    height: 32vh;
    overflow: auto;
    margin-top: 2%;
    margin-bottom: 2%;
    padding-bottom: 2%;
}
.initiativeText {
    top: -20%;
    max-width: auto;
    text-wrap: none;
    text-align: center;
    left: 50%;
    max-width: 100%;
    transform: translate(-50%, -50%);
}
.initiativeInputsText {
    color: black;
    position: relative;
    top: -20%;
}
.initiativeInputs {
    position: relative;
    top: -20%;
    width: 10%;
    text-align: center;
    padding:  0px;
}
input[type=number]::-webkit-inner-spin-button{
    appearance: none;
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
.imgInfoBox {
    width: 17%;
}
.imgDivInitiativeBox {
    width: 10%;
    height: 30%;
    position: relative;
    left: -25%;
    top: 50%;
    transform: translate(-50%, -50%);
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
        width: 55%;
        left: 20%;
    }
    button {
        width: 38%;
        height: 7vh;
    }
    input {
        height: 5vh;
        width: 60%;
    }
    .charBox {
        height: 11.5vh;
        width: 96%;
    }
    .addBtn {
        width: 3vw;
        height: 5vh;
    }
    .removeBtn {
        top: -125%;
        height: 5vh;
        width: 3vw;
    }
    .initiativeText{
        left: 50%;
    }
    .initiativeBox {
        height: 32vh;
    }
    .imgDiv {
        width: 10%;
    }
    .imgInfoBox {
        width: 15%;
    }
    .infosBox {
        width: 35%;
    }
    .functionsBox {
        left: 40%;
    }
    .imgInfoBox {
        width: 17%;
    }
    .imgDivInitiativeBox {
        width: 12%;
    }
}
</style>