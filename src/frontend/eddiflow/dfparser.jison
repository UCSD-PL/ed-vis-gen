
/* description: Parses end evaluates mathematical expressions. */

/* lexical grammar */
%lex
%%
\s+                   {/* skip whitespace */}
[0-9]+("."[0-9]+)?\b  {return 'NUMBER';}
"*"                   {return '*';}
"/"                   {return '/';}
"-"                   {return '-';}
"+"                   {return '+';}
"^"                   {return '^';}
"("                   {return '(';}
")"                   {return ')';}
"PI"                  {return 'PI';}
"E"                   {return 'E';}
([a-z]|[A-Z]|"_"|"-")([a-z]|[A-Z]|"_"|"-"|[0-9])* {return 'IDENT'}
<<EOF>>;               {return 'EOF';}

/lex

/* operator associations and precedence */

%left '+' '-'
%left '*' '/'
%left '^'
%left UMINUS

%start expressions

%% /* language grammar */

expressions
    : e EOF
        {return $1;}
    ;

e
    : e '+' e
        {$$ = {tag:'binop', body: {op: '+', lhs: $1, rhs: $3}};}
    | e '-' e
        {$$ = {tag:'binop', body: {op: '-', lhs: $1, rhs: $3}};}
    | e '*' e
        {$$ = {tag:'binop', body: {op: '*', lhs: $1, rhs: $3}};}
    | e '/' e
        {$$ = {tag:'binop', body: {op: '/', lhs: $1, rhs: $3}};}
    | '-' e %prec UMINUS
        {$$ = {tag:'unop', body: {op: '-', inner: $2}};}
    | '(' e ')'
        {$$ = $2;}
    | NUMBER
        {$$ = {tag:'number', body: Number(yytext)};}
    | IDENT
        {$$ = {tag:'var', body: yytext};}
    | E
        {$$ = {tag:'number', body: Math.E};}
    | PI
        {$$ = {tag:'number', body: Math.PI};}
    ;
