import * as React from "react";
import { ColorValue } from "react-native";
import Svg, { Path } from "react-native-svg";

function PlayIcon({
    color = '#fff',
    viewBox = '0 0 210 210',
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
            <Path d="M179.07 105L30.93 210V0l148.14 105z" />
        </Svg>
    )
}

export default PlayIcon;
