import * as React from "react";
import { ColorValue } from "react-native";
import Svg, { Path } from "react-native-svg";

function PauseIcon({
    color = '#fff',
    viewBox = '0 0 277.338 277.338',
    width = "800px",
    height = "800px",
}: {
    color?: ColorValue;
    viewBox?: string;
    width?: string;
    height?: string;
}) {
    return (
        <Svg
            fill={color}
            height={width}
            width={height}
            viewBox={viewBox}
        >
            <Path d="M14.22 45.665v186.013c0 25.223 16.711 45.66 37.327 45.66 20.618 0 37.339-20.438 37.339-45.66V45.665C88.886 20.454 72.165.008 51.547.008 30.931 0 14.22 20.454 14.22 45.665zM225.78 0c-20.614 0-37.325 20.446-37.325 45.657V231.67c0 25.223 16.711 45.652 37.325 45.652s37.338-20.43 37.338-45.652V45.665C263.109 20.454 246.394 0 225.78 0z" />
        </Svg>
    )
}

export default PauseIcon;
