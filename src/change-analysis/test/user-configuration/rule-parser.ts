/** Categorical Mistake */

/**
 * Document Component types cannot be ComponentProperty and ComponentOperation
 */

const sampleInput = [{
    let: {
        lambda: {type: 'resource', subtype: 'AWS::IAM::Role'},
        role: {resource: 'AWS::IAM::Role', name: 'TheySeeMeRoleing', where: ["role <- lambda", "role.type == lambda.type"]},
    },
    then: [{
        let: {
            //change: "PropertyChange('Principal')",
            // change: "role.Principal change",
            // change: {type: 'proertyChange'}
            // change: {change: 'role.Principal'}
            change: {change: 'UPDATE', where: [
                "change appliesTo role.Principal",
                "change.old == 'someValue'",
                "change.new == 'someNewValue'"
            ]}
        },
        //where: "change.type == 'UPDATE'",
        where: ["role.Principal  change", ],
        then: [
            {
                let: {
                    bucket: "Resource('AWS::S3::Bucket')",
                },
                where: "change.value == bucket.name",
                risk: ["high"],
            }, {
                where: "change.oldValue == 'test'",
                risk: "low",
                action: 'APPROVE|REJECT|[NONE]',
                description: ""
            }
        ]
    }]
}];

// test('Rule parser sample input', () => {
//     console.log(parseRules(sampleInput));
// });