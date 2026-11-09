import next from "eslint-config-next"

const config = [
  ...next,
  {
    ignores: [".next/**", "node_modules/**", "next-env.d.ts"],
  },
  {
    // Primitivas generadas por shadcn/ui (y sus hooks): el código original de
    // shadcn no cumple dos reglas nuevas del React Compiler. No las aplicamos
    // ahí porque se regeneran con `shadcn add`, pero sí en el código propio.
    files: ["components/ui/**/*.{ts,tsx}", "hooks/use-*.ts"],
    rules: {
      "react-hooks/purity": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
]

export default config