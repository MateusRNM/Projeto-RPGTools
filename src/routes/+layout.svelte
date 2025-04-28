<script>
    let { children } = $props();
</script>

<main>{@render children()}</main>

<style>
@font-face {
    font-family: 'imp';
    src: url('../lib/assets/impact.ttf');
}
* {
    font-family: 'imp';
    color: rgb(214, 212, 212);
}
</style>