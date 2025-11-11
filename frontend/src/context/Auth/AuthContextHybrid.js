import React, { createContext } from "react";

import useAuth from "../../hooks/useAuth.js/index.js";
import useSupabaseAuth from "../../hooks/useSupabaseAuth.js";

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
	// Check if Supabase is configured
	const useSupabase = process.env.REACT_APP_SUPABASE_URL && process.env.REACT_APP_SUPABASE_ANON_KEY;
	
	// Use Supabase auth if configured, otherwise fall back to legacy auth
	const legacyAuth = useAuth();
	const supabaseAuth = useSupabaseAuth();
	
	const auth = useSupabase ? supabaseAuth : legacyAuth;

	return (
		<AuthContext.Provider
			value={{ 
				loading: auth.loading, 
				user: auth.user, 
				isAuth: auth.isAuth, 
				handleLogin: auth.handleLogin, 
				handleLogout: auth.handleLogout,
				authType: useSupabase ? 'supabase' : 'legacy',
				updateUserMetadata: auth.updateUserMetadata,
				resetPassword: auth.resetPassword
			}}
		>
			{children}
		</AuthContext.Provider>
	);
};

export { AuthContext, AuthProvider };