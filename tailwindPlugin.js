import { execSync } from 'child_process';

export const tailwindPlugin = {
    name: 'tailwind-plugin',
    setup(build) {
        build.onEnd(() => {
            console.log('Compiling styles using Tailwind CSS...');
            try {
				const isProd = build.initialOptions.minify;
                const minifyFlag = isProd ? '--minify' : '';

                // Execute Tailwind CLI
                execSync(`npx @tailwindcss/cli -i ./media/styles.css -o ./dist/styles.css ${minifyFlag}`, {
                    stdio: 'inherit'
                });
                console.log('Styles successfully generated using Tailwind CSS.');
            } catch (err) {
                console.error('Tailwind CLI execution failed:', err.message);
            }
        });
    }
};