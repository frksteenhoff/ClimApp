function getSliderDiffFromSystemPrediction(kb, thermal, slider_value) {
    // perceived - predicted
    return (slider_value - kb.user.adaptation[thermal].predicted).toFixed(2);
}