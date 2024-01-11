import React from "react";

import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client";
import { useState } from "react";
import { Blurhash } from "react-blurhash";
import { useApi } from "../../utils/store/api";
interface BlurredImageProps
	extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src" | "alt"> {
	item: BaseItemDto;
	blurredClassName?: string;
	width: number;
	height: number;
}

export const BlurredImage = ({
	item,
	width,
	height,
	blurredClassName,
	className,
	...rest
}: BlurredImageProps) => {
	const [loaded, setLoaded] = useState(false);
	const [api] = useApi((state) => [state.api]);

	const src = api!.getItemImageUrl(item.Id!, "Primary", {
		quality: 90,
		fillHeight: height,
		fillWidth: width,
	});

	const blurHash = item.ImageBlurHashes?.Primary
		? Object.values(item.ImageBlurHashes.Primary)[0]
		: null;

	const alt = item.Name || "";

	return (
		<div
			style={{
				position: "relative",
				width: "100%",
				height: "100%",
			}}
		>
			{blurHash && (
				<Blurhash
					hash={blurHash}
					width={width}
					height={height}
					resolutionX={24}
					resolutionY={24}
					className={blurredClassName}
					style={{
						position: "absolute",
						opacity: loaded ? 0 : 1,
						transition: "opacity 0.25s ease",
					}}
				/>
			)}
			<img
				loading="lazy"
				{...rest}
				alt={alt}
				src={src}
				className={className}
				style={{
					opacity: loaded ? 1 : 0,
					transition: "opacity 0.25s ease",
					position: "absolute",
				}}
				onLoad={() => setLoaded(true)}
			/>
		</div>
	);
};
