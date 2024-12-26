import passport from "passport";
import { setupJwtStrategy } from "../common/strategies/jwt.strategie";

const intializePassport = () => {
    setupJwtStrategy(passport);
};
  
intializePassport();

export default passport;
