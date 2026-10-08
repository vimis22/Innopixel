const faces = ["front", "back", "left", "right", "top", "bottom"];

function WireframeCube() {
    return (
        <div className="story-cube-wrapper">
            <div className="wireframe-cube">
                {faces.map((face) => (
                    <div key={face} className={`cube-face ${face}`} />
                ))}
            </div>
        </div>
    );
}

export default WireframeCube;