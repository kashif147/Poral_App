
export const If = (props) => {
    const { condition, children, elseComp } = props;
    if (condition) {
        return children;
    }
    else {
        return elseComp ? elseComp : null;
    }
};
