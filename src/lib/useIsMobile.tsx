import { useIsMounted, useWindowSize } from "usehooks-ts";

export const useIsMobile = () => {
  const { width = 0 } = useWindowSize();
  const isMounted = useIsMounted();
  const isMobile = isMounted() ? width < 1024 : false;
  return isMobile;
};
