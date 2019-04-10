// Toast 
function showShortToast(textToShow){
    window.plugins.toast.showWithOptions(
    {
        message: textToShow,
        duration: "short", // 2000 ms
        position: "bottom",
        addPixelsY: -40  // giving a margin at the bottom by moving text up
    });
}