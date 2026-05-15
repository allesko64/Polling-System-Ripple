export interface Poll{
    id : string,
    creatorId : string,
    title : string,
    description? : string,
    isAnonymous : boolean,
    expiresAt : Date,
    status : 'active' | 'draft' | 'closed' | 'published',
    createdAt : Date,
    updatedAt : Date
}

export interface Question{
    id : string,
    pollId : string,
    text : string,
    isMandatory : boolean,
    orderIndex : number,
    createdAt : Date

}

export interface Option{
        id : string,
        questionId : string,
        text : string,
        orderIndex : number,
        createdAt : Date
}

