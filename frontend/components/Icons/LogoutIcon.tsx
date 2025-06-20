import * as React from "react";
import { ColorValue } from "react-native";
import Svg, { Path } from "react-native-svg";

function LogoutIcon({
    color = '#fff',
    viewBox = "0 0 24 24",
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
            <Path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M16.125 12a.75.75 0 00-.75-.75H4.402l1.961-1.68a.75.75 0 10-.976-1.14l-3.5 3a.75.75 0 000 1.14l3.5 3a.75.75 0 10.976-1.14l-1.96-1.68h10.972a.75.75 0 00.75-.75z"
                fill={color}
            />
            <Path
                d="M9.375 8c0 .702 0 1.053.169 1.306a1 1 0 00.275.275c.253.169.604.169 1.306.169h4.25a2.25 2.25 0 010 4.5h-4.25c-.702 0-1.053 0-1.306.168a1 1 0 00-.275.276c-.169.253-.169.604-.169 1.306 0 2.828 0 4.243.879 5.121.878.879 2.292.879 5.12.879h1c2.83 0 4.243 0 5.122-.879.879-.878.879-2.293.879-5.121V8c0-2.828 0-4.243-.879-5.121C20.617 2 19.203 2 16.375 2h-1c-2.829 0-4.243 0-5.121.879-.879.878-.879 2.293-.879 5.121z"
                fill={color}
            />
        </Svg>
    )
}

export default LogoutIcon;
